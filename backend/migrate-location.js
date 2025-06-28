const mongoose = require('mongoose');
const Adoption = require('./models/adoptionModel');
require('dotenv').config();

async function migrateLocation() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('Connected to MongoDB successfully');

    console.log('Starting location migration...');
    
    // Find all adoption posts that don't have a location field or have empty location
    const postsWithoutLocation = await Adoption.find({
      $or: [
        { location: { $exists: false } },
        { location: null },
        { location: '' }
      ]
    });
    
    console.log(`Found ${postsWithoutLocation.length} posts without location`);
    
    if (postsWithoutLocation.length === 0) {
      console.log('No posts need location migration');
      return;
    }
    
    // Update all posts without location to have a default location
    const updateResult = await Adoption.updateMany(
      {
        $or: [
          { location: { $exists: false } },
          { location: null },
          { location: '' }
        ]
      },
      { 
        $set: { location: 'Location not specified' }
      }
    );
    
    console.log('Migration completed successfully!');
    console.log('Updated posts:', updateResult.modifiedCount);
    console.log('Total posts found:', postsWithoutLocation.length);
    
    // Verify the migration
    const remainingPostsWithoutLocation = await Adoption.find({
      $or: [
        { location: { $exists: false } },
        { location: null },
        { location: '' }
      ]
    });
    
    console.log('Posts still without location after migration:', remainingPostsWithoutLocation.length);
    
    // Show some examples of updated posts
    const samplePosts = await Adoption.find().limit(5);
    console.log('\nSample posts after migration:');
    samplePosts.forEach(post => {
      console.log(`- ${post.name}: ${post.location}`);
    });
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateLocation(); 