import 'dotenv/config';
import mongoose from 'mongoose';
import Board from './models/Board.js';
import List from './models/List.js';
import Card from './models/Card.js';

const userId = '69fd6d30f8fe15ac2495a3ee';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log('DB Connected');

    // Clear existing data
    await Board.deleteMany({});
    await List.deleteMany({});
    await Card.deleteMany({});

    // Create boards with members
    const board1 = await Board.create({
      name: 'Project Alpha',
      createdBy: userId,
      members: [{
        userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      }]
    });

    const board2 = await Board.create({
      name: 'Project Beta',
      createdBy: userId,
      members: [{
        userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin'
      }]
    });

    console.log('Boards created:', board1.name, board2.name);

    // Create lists for Project Alpha
    const list1 = await List.create({ title: 'To Do', boardId: board1._id, createdBy: userId });
    const list2 = await List.create({ title: 'In Progress', boardId: board1._id, createdBy: userId });
    const list3 = await List.create({ title: 'Done', boardId: board1._id, createdBy: userId });

    // Create lists for Project Beta
    const list4 = await List.create({ title: 'Backlog', boardId: board2._id, createdBy: userId });
    const list5 = await List.create({ title: 'In Progress', boardId: board2._id, createdBy: userId });

    console.log('Lists created');

    // Create cards for Project Alpha - To Do
    await Card.create({ title: 'Design database schema', listId: list1._id, order: 0, createdBy: userId });
    await Card.create({ title: 'Setup project repository', listId: list1._id, order: 1, createdBy: userId });

    // Create cards for Project Alpha - In Progress
    await Card.create({ title: 'Implement user authentication', listId: list2._id, order: 0, createdBy: userId });

    // Create cards for Project Beta - Backlog
    await Card.create({ title: 'Setup CI/CD pipeline', listId: list4._id, order: 0, createdBy: userId });
    await Card.create({ title: 'Write unit tests', listId: list4._id, order: 1, createdBy: userId });

    console.log('Cards created');
    console.log('Seed data inserted successfully');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
