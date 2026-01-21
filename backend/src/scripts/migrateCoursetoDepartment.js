/**
 * Migration Script: Migrate course field to department field for students
 * 
 * This script migrates all student records that have a 'course' field
 * to use the 'department' field instead.
 * 
 * Run this script once after updating the User model.
 * 
 * Usage:
 *   node src/scripts/migrateCoursetoDepartment.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/geims-complaint-portal';

async function migrateCoursetoDepartment() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Find all students that have 'course' field but not 'department' field
    console.log('Finding students with course field...');
    const studentsWithCourse = await usersCollection.find({
      role: 'STUDENT',
      course: { $exists: true, $ne: null }
    }).toArray();

    console.log(`Found ${studentsWithCourse.length} students with course field\n`);

    if (studentsWithCourse.length === 0) {
      console.log('No students need migration. All done!');
      await mongoose.connection.close();
      return;
    }

    // Show sample of what will be migrated
    console.log('Sample records to be migrated:');
    studentsWithCourse.slice(0, 5).forEach((student, idx) => {
      console.log(`  ${idx + 1}. ${student.name} (${student.email})`);
      console.log(`     course: "${student.course}" → department: "${student.course}"`);
    });

    console.log('\nStarting migration...\n');

    let migratedCount = 0;
    let errorCount = 0;

    for (const student of studentsWithCourse) {
      try {
        // Copy course value to department field
        await usersCollection.updateOne(
          { _id: student._id },
          {
            $set: { department: student.course },
            $unset: { course: 1 } // Remove the old course field
          }
        );
        migratedCount++;
        console.log(`✓ Migrated: ${student.name} (${student.email})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Error migrating ${student.email}:`, error.message);
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Successfully migrated: ${migratedCount} students`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Total processed: ${studentsWithCourse.length}`);

    // Verify migration
    console.log('\nVerifying migration...');
    const remainingWithCourse = await usersCollection.countDocuments({
      role: 'STUDENT',
      course: { $exists: true, $ne: null }
    });

    const withDepartment = await usersCollection.countDocuments({
      role: 'STUDENT',
      department: { $exists: true, $ne: null }
    });

    console.log(`Students still with course field: ${remainingWithCourse}`);
    console.log(`Students with department field: ${withDepartment}`);

    if (remainingWithCourse === 0) {
      console.log('\n✓ Migration verified successfully!');
    } else {
      console.log('\n⚠ Warning: Some students still have course field. You may need to run the migration again.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the migration
migrateCoursetoDepartment();
