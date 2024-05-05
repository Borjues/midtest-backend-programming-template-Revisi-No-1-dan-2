const { User } = require('../../../models');

/**
 * Get a list of users
 * @returns {Promise}
 */
async function getUsers(noPage, sizePage, sortPage, searchPage) {
  try {
    // Initialize an empty query object
    let query = {};

    // Check if searchPage exists
    if (searchPage) {
      // Destructure Fold_Pages and VALUE from the split searchPage
      const [Fold_Pages, VALUE] = searchPage.split(':');
      // If Fold_Pages and VALUE exist, construct query object with $regex and $options
      if (Fold_Pages && VALUE) {
        query = {
          [Fold_Pages]: { $regex: VALUE, $options: 'i' },
        };
      }
    }

    // Get the total count of users matching the query
    const countTOTAL = await User.countDocuments(query);

    let pages_Sort;
    // Determine sorting criteria based on sortPage value
    if (sortPage === 'desc') {
      // If sortPage is 'desc', sort by name in descending order
      pages_Sort = { name: -1 };
    } else {
      // Otherwise, sort by name in ascending order
      pages_Sort = { name: 1 };
    }

    // Modify sorting criteria if sortPage includes ':desc'
    if (sortPage.includes(':desc')) {
      // Destructure NamePage and orders from the split sortPage
      const [NamePage, orders] = sortPage.split(' : ');
      // If NamePage is 'name' or 'email', sort by that field in descending order
      if (NamePage === 'name' || NamePage === 'email') {
        pages_Sort = { [NamePage]: -1 };
      }
    }

    let users;
    // Fetch users based on pagination and query parameters
    if (sizePage === 0) {
      // If sizePage is 0, fetch all users without pagination
      users = await User.find(query).sort(pages_Sort);
    } else {
      // Otherwise, fetch users with pagination and limit/offset
      users = await User.find(query)
        .sort(pages_Sort)
        .limit(sizePage)
        .skip(noPage - 1);
    }

    const Total_Pages = Math.ceil(countTOTAL / sizePage);
    const has_previous_page = noPage > 1;
    const has_next_page = sizePage < Total_Pages;

    return {
      page_number: noPage,
      page_size: sizePage,
      page_total: Total_Pages,
      has_previous_page: has_previous_page,
      has_next_page: has_next_page,
      data: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        is_active: user.isActive,
        registration_date: user.registrationDate,
        last_login: user.lastLogin,
      })),
    };
  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Get user detail
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function getUser(id) {
  return User.findById(id);
}

/**
 * Create new user
 * @param {string} name - Name
 * @param {string} email - Email
 * @param {string} password - Hashed password
 * @returns {Promise}
 */
async function createUser(name, email, password) {
  return User.create({
    name,
    email,
    password,
  });
}

/**
 * Update existing user
 * @param {string} id - User ID
 * @param {string} name - Name
 * @param {string} email - Email
 * @returns {Promise}
 */
async function updateUser(id, name, email) {
  return User.updateOne(
    {
      _id: id,
    },
    {
      $set: {
        name,
        email,
      },
    }
  );
}

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise}
 */
async function deleteUser(id) {
  return User.deleteOne({ _id: id });
}

/**
 * Get user by email to prevent duplicate email
 * @param {string} email - Email
 * @returns {Promise}
 */
async function getUserByEmail(email) {
  return User.findOne({ email });
}

/**
 * Update user password
 * @param {string} id - User ID
 * @param {string} password - New hashed password
 * @returns {Promise}
 */
async function changePassword(id, password) {
  return User.updateOne({ _id: id }, { $set: { password } });
}

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserByEmail,
  changePassword,
};
