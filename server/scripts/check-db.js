const { sequelize, User, Exam, Question, Class } = require('../models');

async function check() {
    try {
        await sequelize.sync();
        console.log('Sync complete');
        const userCount = await User.count();
        const examCount = await Exam.count();
        const classCount = await Class.count();

        console.log('--- DATABASE STATUS ---');
        console.log('Users:', userCount);
        console.log('Exams:', examCount);
        console.log('Classes:', classCount);

        const admin = await User.findOne({ where: { username: 'admin' } });
        console.log('Admin found:', !!admin);
        if (admin) console.log('Admin details:', admin.toJSON());

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

check();
