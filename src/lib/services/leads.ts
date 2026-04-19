import dbConnect from '../mongodb';
import { LeadModel, LeadFollowupModel } from '@/models/Lead';
import { AdminProfileModel } from '@/models/AdminProfile';
import { DashboardStatsModel } from '@/models/Stats';
import { UserModel } from '@/models/User';
import { Lead, CreateLeadInput, LeadStatus, LeadFollowup, CreateFollowupInput } from '@/types';

/**
 * Map Lead Mongoose Doc to Interface
 */
function mapLead(doc: any): Lead {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    id: data._id.toString(),
    studentId: data.studentId.toString(),
    // Denormalized student info
    studentName: data.studentName || '',
    studentPhone: data.studentPhone || '',
    studentEmail: data.studentEmail || '',
    studentLocation: data.studentLocation || '',
    rankUsed: data.rankUsed,
    preferredBranch: data.preferredBranch,
    year: data.year,
    status: data.status,
    callbackRequested: data.callbackRequested,
    assignedAdminId: data.assignedAdminId ? data.assignedAdminId.toString() : null,
    assignedAt: data.assignedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    // Optional populated user info
    studentDetails: data.studentDetails ? {
      firstName: data.studentDetails.firstName,
      lastName: data.studentDetails.lastName,
      email: data.studentDetails.email,
      phone: data.studentDetails.phone,
      city: data.studentDetails.city,
      state: data.studentDetails.state,
    } : undefined
  } as Lead;
}

/**
 * Map Followup Mongoose Doc to Interface
 */
function mapFollowup(doc: any): LeadFollowup {
  const data = doc.toObject ? doc.toObject() : doc;
  return {
    id: data._id.toString(),
    leadId: data.leadId.toString(),
    adminId: data.adminId.toString(),
    remark: data.remark,
    nextCallbackDate: data.nextCallbackDate,
    status: data.status,
    createdAt: data.createdAt,
  } as LeadFollowup;
}

/**
 * Create or update a lead when student performs college lookup
 * Uses an atomic UPSERT strategy to prevent duplicate leads even under race conditions
 */
export async function createLead(data: CreateLeadInput): Promise<Lead> {
  await dbConnect();
  
  const query = {
    studentId: data.studentId,
    // Broaden the search to any active lead for this student to prevent duplicates 
    // during a single session/fill process
    status: { $in: ['new', 'assigned', 'in_progress'] }
  };

  const update = {
    $set: {
      ...data,
      updatedAt: new Date()
    },
    $setOnInsert: {
      status: 'new',
      callbackRequested: false,
      assignedAdminId: null,
      assignedAt: null,
      createdAt: new Date()
    }
  };

  // Atomic operation to prevent race conditions
  const result = await LeadModel.findOneAndUpdate(query, update, {
    upsert: true,
    new: true,
    rawResult: true // This helps us know if it was an insert or update
  });

  const lead = result.value || result;
  
  // ONLY increment totalRequests in stats if a NEW document was actually inserted
  // mongoose findOneAndUpdate result contains 'lastErrorObject.updatedExisting'
  const isNew = !(result.lastErrorObject?.updatedExisting);
  
  if (isNew) {
    let statsDoc = await DashboardStatsModel.findOne();
    if (!statsDoc) {
      statsDoc = await DashboardStatsModel.create({
        totalRegistrations: 0,
        totalInfoFilled: 0,
        totalRequests: 0,
        pendingCallbacks: 0,
      });
    }
    
    await DashboardStatsModel.findByIdAndUpdate(statsDoc._id, {
      $inc: { totalRequests: 1 }
    });
  }

  return mapLead(lead);
}

/**
 * Get a lead by ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  await dbConnect();
  const doc = await LeadModel.findById(id);
  
  if (!doc) {
    return null;
  }
  
  return mapLead(doc);
}

/**
 * Get all leads with optional filters
 */
export async function getLeads(options: {
  status?: LeadStatus;
  callbackRequested?: boolean;
  assignedAdminId?: string;
  limit?: number;
  startAfter?: string;
} = {}): Promise<Lead[]> {
  await dbConnect();
  
  let query: any = {};
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.callbackRequested !== undefined) {
    query.callbackRequested = options.callbackRequested;
  }

  if (options.assignedAdminId) {
    query.assignedAdminId = options.assignedAdminId;
  }
  
  let dbQuery = LeadModel.find(query).sort({ createdAt: -1 });
  
  if (options.startAfter) {
    const startDoc = await LeadModel.findById(options.startAfter);
    if (startDoc) {
      dbQuery = dbQuery.where('createdAt').lt(startDoc.createdAt as any);
    }
  }
  
  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }
  
  const docs = await dbQuery.exec();
  const leads = docs.map(mapLead);

  // If some leads are missing names, we could optionally populate them here
  // But for now we return them as is, and the Admin UI can handle it or we use the lookup helper
  return leads;
}

/**
 * Populate student names and details for a list of leads using manual join
 */
export async function populateStudentInfo(leads: Lead[]): Promise<Lead[]> {
  if (leads.length === 0) return [];
  
  await dbConnect();
  
  const studentIds = Array.from(new Set(leads.map(l => l.studentId)));
  const users = await UserModel.find({ _id: { $in: studentIds } });
  const userMap = new Map(users.map(u => [u._id.toString(), u]));
  
  return leads.map(lead => {
    const user = userMap.get(lead.studentId);
    if (!user) return lead;
    
    // If denormalized name is missing, use user name
    if (!lead.studentName) {
      lead.studentName = `${user.firstName} ${user.lastName}`.trim() || user.email.split('@')[0];
    }
    if (!lead.studentPhone) lead.studentPhone = user.phone || '';
    if (!lead.studentEmail) lead.studentEmail = user.email || '';
    if (!lead.studentLocation) lead.studentLocation = `${user.city}, ${user.state}`.replace(/^, |, $/g, '');
    
    return lead;
  });
}

/**
 * Assign a lead to an admin
 */
export async function assignLead(
  leadId: string,
  adminId: string
): Promise<void> {
  await dbConnect();
  console.log("TRACE: assignLead START", { leadId, adminId });
  const now = new Date();
  
  try {
    await Promise.all([
      (async () => {
        console.log("TRACE: Updating lead assignment...");
        const lead = await LeadModel.findByIdAndUpdate(leadId, {
          assignedAdminId: adminId,
          status: 'assigned',
          assignedAt: now,
        });
        console.log("TRACE: Lead updated:", lead ? "Found" : "NOT FOUND");
      })(),
      (async () => {
        console.log("TRACE: Updating admin profile...");
        // Use upsert or check existence to prevent silent failures if profile missing
        const profile = await AdminProfileModel.findOneAndUpdate(
          { userId: adminId },
          { $inc: { currentActiveLeads: 1 } },
          { new: true, upsert: false } // We don't want to create a profile if it doesn't exist, but we should log it
        );
        if (!profile) {
          console.warn(`TRACE: WARNING - Admin profile not found for userId: ${adminId}. Lead assigned regardless.`);
        } else {
          console.log("TRACE: Admin profile updated successfully");
        }
      })(),
      (async () => {
         console.log("TRACE: Updating dashboard stats...");
         let statsDoc = await DashboardStatsModel.findOne();
         if (!statsDoc) {
             console.log("TRACE: Stats doc missing, creating initial stats...");
             statsDoc = await DashboardStatsModel.create({
               totalRegistrations: 0,
               totalInfoFilled: 0,
               totalRequests: 0,
               pendingCallbacks: 0,
             });
         }
         
         await DashboardStatsModel.findByIdAndUpdate(statsDoc._id, {
           $inc: { pendingCallbacks: 1 }
         });
         console.log("TRACE: Stats incremented");
      })()
    ]);
    console.log("TRACE: assignLead SUCCESS");
  } catch (error: any) {
    console.error("TRACE: assignLead ERROR:", error.message, error.stack);
    throw error;
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string,
  status: LeadStatus
): Promise<void> {
  await dbConnect();
  console.log("TRACE: updateLeadStatus START", { leadId, status });
  
  try {
    const lead = await LeadModel.findById(leadId);
    if (!lead) {
      console.error("TRACE: updateLeadStatus ERROR - Lead not found", leadId);
      throw new Error('Lead not found');
    }
    console.log("TRACE: Lead found for status update, current status:", lead.status);
    
    await LeadModel.findByIdAndUpdate(leadId, { status });
    console.log("TRACE: Lead status updated to:", status);
    
    // If completing or closing, decrement admin's active leads and pending callbacks
    if ((status === 'completed' || status === 'closed') && lead.assignedAdminId) {
      console.log("TRACE: Decrementing leads and stats for completion/closure...", { adminId: lead.assignedAdminId });
      await Promise.all([
        (async () => {
           console.log("TRACE: Updating admin active leads...");
           const profile = await AdminProfileModel.findOneAndUpdate({ userId: lead.assignedAdminId }, {
             $inc: { currentActiveLeads: -1 }
           });
           console.log("TRACE: Admin profile updated:", profile ? "Found" : "NOT FOUND");
        })(),
        (async () => {
           console.log("TRACE: Updating dashboard stats...");
           const statsDoc = await DashboardStatsModel.findOne();
           if (statsDoc) {
               console.log("TRACE: Stats found, decrementing pending callbacks...");
               await DashboardStatsModel.findByIdAndUpdate(statsDoc._id, {
                 $inc: { pendingCallbacks: -1 }
               });
               console.log("TRACE: Stats decremented");
           } else {
               console.log("TRACE: NOTICE - Stats doc not found during status update");
           }
        })()
      ]);
    }
    console.log("TRACE: updateLeadStatus SUCCESS");
  } catch (error: any) {
    console.error("TRACE: updateLeadStatus ERROR:", error.message, error.stack);
    throw error;
  }
}

/**
 * Request callback for a lead
 */
export async function requestCallback(leadId: string): Promise<void> {
  await dbConnect();
  await LeadModel.findByIdAndUpdate(leadId, {
    callbackRequested: true,
  });
}

/**
 * Add a follow-up to a lead
 */
export async function createFollowup(
  adminId: string,
  data: CreateFollowupInput
): Promise<LeadFollowup> {
  await dbConnect();
  
  const followup = await LeadFollowupModel.create({
    leadId: data.leadId,
    adminId,
    remark: data.remark,
    nextCallbackDate: data.nextCallbackDate || null,
    status: 'pending',
  });

  // Update lead status to in_progress
  await LeadModel.findByIdAndUpdate(data.leadId, {
    status: 'in_progress',
  });
  
  return mapFollowup(followup);
}

/**
 * Get follow-ups for a lead
 */
export async function getFollowupsByLeadId(leadId: string): Promise<LeadFollowup[]> {
  await dbConnect();
  const docs = await LeadFollowupModel.find({ leadId }).sort({ createdAt: -1 });
  return docs.map(mapFollowup);
}

/**
 * Mark a follow-up as completed
 */
export async function completeFollowup(followupId: string): Promise<void> {
  await dbConnect();
  await LeadFollowupModel.findByIdAndUpdate(followupId, { status: 'completed' });
}

/**
 * Count leads by status
 */
export async function countLeadsByStatus(status: LeadStatus): Promise<number> {
  await dbConnect();
  return LeadModel.countDocuments({ status });
}

/**
 * Get leads assigned to an admin with pending callbacks
 */
export async function getAdminPendingCallbacks(adminId: string): Promise<Lead[]> {
  await dbConnect();
  const docs = await LeadModel.find({
    assignedAdminId: adminId,
    status: { $in: ['assigned', 'in_progress'] }
  }).sort({ createdAt: -1 });
  
  return docs.map(mapLead);
}
