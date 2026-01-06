/**
 * One-time migration: convert existing complaintId prefix from GEHU -> GEIMS.
 *
 * - Only updates complaint documents whose complaintId matches /^GEHU\d{6}$/
 * - Converts to GEIMS + same 6 digits when possible
 * - If a conflict exists (target ID already used), generates a new unique GEIMS ID
 *
 * Usage:
 *   cd backend
 *   node src/scripts/migrateComplaintIdsToGEIMS.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';

import connectDB from '../config/database.js';
import Complaint from '../models/Complaint.js';

dotenv.config();

const GEIMS_PREFIX = 'GEIMS';

const generateGeimsId = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `${GEIMS_PREFIX}${randomDigits}`;
};

const getUniqueGeimsId = async () => {
  // Extremely unlikely to loop long, but keep it safe.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = generateGeimsId();
    // Using lean() keeps it fast.
    const exists = await Complaint.exists({ complaintId: candidate });
    if (!exists) return candidate;
  }
};

const main = async () => {
  await connectDB();

  const filter = { complaintId: { $regex: /^GEHU\d{6}$/ } };

  const total = await Complaint.countDocuments(filter);
  console.log(`Found ${total} complaint(s) with GEHU prefix.`);

  if (total === 0) {
    await mongoose.connection.close();
    return;
  }

  const cursor = Complaint.find(filter).cursor();

  let updated = 0;
  let conflicted = 0;

  // eslint-disable-next-line no-restricted-syntax
  for await (const complaint of cursor) {
    const oldId = complaint.complaintId;
    const digits = String(oldId).slice(4); // after GEHU
    const desired = `${GEIMS_PREFIX}${digits}`;

    const conflict = await Complaint.exists({ complaintId: desired, _id: { $ne: complaint._id } });

    complaint.complaintId = conflict ? await getUniqueGeimsId() : desired;

    if (conflict) {
      conflicted += 1;
      console.warn(`Conflict for ${desired}; assigned ${complaint.complaintId} (doc ${complaint._id})`);
    }

    await complaint.save();
    updated += 1;

    if (updated % 50 === 0) {
      console.log(`Progress: ${updated}/${total}`);
    }
  }

  console.log(`Done. Updated ${updated} complaint(s). Conflicts handled: ${conflicted}.`);
  await mongoose.connection.close();
};

main().catch(async (err) => {
  console.error('Migration failed:', err);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});
