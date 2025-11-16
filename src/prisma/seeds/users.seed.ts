export const userSeedData = async () => [
  {
    email: 'user1@nutrimate.com',
    passwordHash: 'password123', 
    fullName: 'Người Dùng Một',
    gender: 'Nam',
    dateOfBirth: new Date('1990-01-15'),
  },
  {
    email: 'user2@nutrimate.com',
    passwordHash: 'password123',
    fullName: 'Người Dùng Hai',
    gender: 'Nữ',
    dateOfBirth: new Date('1995-05-20'),
  },
];