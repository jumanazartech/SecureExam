const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { User } = require('../models');
const { assertStudentSlots } = require('./limits');
const { parseFullName, uniqueUsername } = require('../utils/credentials');

// Login and password are identical (kept from the original requirement) and always lowercase.
const planAccounts = async (lines, order) => {
    const cleaned = lines.map(l => String(l || '').trim()).filter(Boolean);
    const parsed = cleaned.map(line => ({ line, name: parseFullName(line, order) }));

    const bases = parsed.filter(p => p.name && p.name.base).map(p => p.name.base);
    const taken = new Set(
        (await User.findAll({
            where: { username: { [Op.iLike]: { [Op.any]: bases.map(b => `${b}%`) } } },
            attributes: ['username']
        })).map(u => u.username.toLowerCase())
    );

    return parsed.map(({ line, name }) => {
        if (!name || !name.base) {
            return { input: line, error: 'Name must contain letters' };
        }
        const username = uniqueUsername(name.base, taken);
        return {
            input: line,
            username,
            password: username,
            first_name: name.first_name,
            last_name: name.last_name
        };
    });
};

const createStudents = async (lines, { order, class_id = null, created_by = null, owner = null }) => {
    const plan = await planAccounts(lines, order);
    // Plan cap: `owner` is the teacher account paying for these seats (admins are unlimited)
    if (owner) await assertStudentSlots(owner, plan.filter(p => !p.error).length);
    const created = [];
    const errors = [];

    for (const item of plan) {
        if (item.error) {
            errors.push({ name: item.input, error: item.error });
            continue;
        }
        try {
            await User.create({
                username: item.username,
                password_hash: await bcrypt.hash(item.password, 10),
                plain_password: item.password,
                first_name: item.first_name,
                last_name: item.last_name,
                role: 'student',
                class_id,
                created_by
            });
            created.push({
                username: item.username,
                password: item.password,
                first_name: item.first_name,
                last_name: item.last_name
            });
        } catch (err) {
            errors.push({ name: item.input, error: err.message });
        }
    }
    return { created, errors };
};

module.exports = { planAccounts, createStudents };
