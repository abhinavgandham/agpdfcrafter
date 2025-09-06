const fs = require('fs');
const path = require('path');
const users = path.join(process.cwd(), 'users.json');

const getAllUsers = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }
        const {sortBy = 'id', order = 'asc'} = req.query;
        const usersData = JSON.parse(fs.readFileSync(users, 'utf8'));

        let cleanUsers = usersData.users.map(({ id, username, email, fullName, role }) => ({
            id,
            username,
            email,
            fullName,
            role
        }));

        cleanUsers.sort((a, b) => {
            order == 'asc' ? a[sortBy] > b[sortBy] ? 1 : -1 : a[sortBy] < b[sortBy] ? 1 : -1;
               
        })
        
        return res.status(200).json(cleanUsers);

    }
    catch(error)  {
        return res.status(500).json({message: "Internal Server Error."})
    }
}


const getUserById = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({message: "Unauthorized"});
        }

        const { id } = req.params;

        const usersData = JSON.parse(fs.readFileSync(users, 'utf8'));

        const user = usersData.users.find(u => u.id === Number(id));

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { password, ...cleanUser } = user;

        return res.status(200).json(cleanUser);

    } catch (error) {
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

module.exports = {getAllUsers, getUserById};