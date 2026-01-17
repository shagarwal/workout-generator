// This script adds instructions and images to exercises
// Run with: node add-exercise-details.js

const fs = require('fs');

const exerciseDetails = {
  'incline-barbell-bench': {
    instructions: [
      'Set bench to 30-45 degree incline',
      'Lie back with feet flat on ground',
      'Grip barbell slightly wider than shoulders',
      'Lower bar to upper chest with control',
      'Press bar up until arms fully extended',
      'Keep shoulder blades retracted throughout'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=800'
  },
  'decline-barbell-bench': {
    instructions: [
      'Set bench to decline position and secure feet',
      'Lie back and grip barbell slightly wider than shoulders',
      'Unrack bar and position over lower chest',
      'Lower bar to lower chest with control',
      'Press explosively back to start position',
      'Maintain stability throughout movement'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800'
  },
  'close-grip-bench': {
    instructions: [
      'Lie on bench with hands shoulder-width apart',
      'Keep elbows tucked close to body',
      'Unrack bar and lower to lower chest',
      'Keep wrists straight throughout movement',
      'Press up focusing on tricep contraction',
      'Lock out arms at top of movement'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800'
  },
  'dumbbell-bench-press': {
    instructions: [
      'Lie on flat bench holding dumbbells at chest level',
      'Plant feet firmly on ground',
      'Press dumbbells up until arms extended',
      'Lower dumbbells with control to chest level',
      'Keep elbows at 45-degree angle',
      'Maintain tension throughout movement'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800'
  },
  'incline-dumbbell-press': {
    instructions: [
      'Set bench to 30-45 degree incline',
      'Sit with dumbbells resting on thighs',
      'Kick dumbbells up to shoulder level',
      'Press dumbbells up and slightly together',
      'Lower with control back to shoulders',
      'Keep core engaged throughout'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800'
  },
};

// Add to file - this is just a template
console.log('Exercise details ready to add');
console.log(JSON.stringify(exerciseDetails, null, 2));
