// Middleware validation cho các request

// Validate đăng ký user
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Tên phải có ít nhất 2 ký tự' });
  }
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ' });
  }
  
  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
  
  next();
};

// Validate đăng nhập
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !isValidEmail(email)) {
    return res.status(400).json({ message: 'Email không hợp lệ' });
  }
  
  if (!password) {
    return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
  }
  
  next();
};

// Validate tạo nhà hàng
export const validateRestaurant = (req, res, next) => {
  const { name, address } = req.body;
  
  if (!name || name.trim().length < 3) {
    return res.status(400).json({ message: 'Tên nhà hàng phải có ít nhất 3 ký tự' });
  }
  
  if (!address || address.trim().length < 5) {
    return res.status(400).json({ message: 'Địa chỉ phải có ít nhất 5 ký tự' });
  }
  
  next();
};

// Validate tạo món ăn
export const validateMenuItem = (req, res, next) => {
  const { name, price } = req.body;
  
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: 'Tên món ăn phải có ít nhất 2 ký tự' });
  }
  
  if (!price || price < 0) {
    return res.status(400).json({ message: 'Giá món ăn không hợp lệ' });
  }
  
  next();
};

// Validate tạo đơn hàng
export const validateOrder = (req, res, next) => {
  const { restaurantId, items, deliveryAddress, contactPhone } = req.body;
  
  if (!restaurantId) {
    return res.status(400).json({ message: 'Vui lòng chọn nhà hàng' });
  }
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Đơn hàng phải có ít nhất 1 món' });
  }
  
  if (!deliveryAddress || deliveryAddress.trim().length < 5) {
    return res.status(400).json({ message: 'Địa chỉ giao hàng không hợp lệ' });
  }
  
  if (!contactPhone || !isValidPhone(contactPhone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
  }
  
  next();
};

// Validate tạo review
export const validateReview = (req, res, next) => {
  const { orderId, restaurantId, restaurantRating } = req.body;
  
  if (!orderId) {
    return res.status(400).json({ message: 'Không tìm thấy đơn hàng' });
  }
  
  if (!restaurantId) {
    return res.status(400).json({ message: 'Không tìm thấy nhà hàng' });
  }
  
  if (!restaurantRating || restaurantRating < 1 || restaurantRating > 5) {
    return res.status(400).json({ message: 'Đánh giá phải từ 1 đến 5 sao' });
  }
  
  next();
};

// Validate MongoDB ObjectId
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: `${paramName} không hợp lệ` });
    }
    
    next();
  };
};

// Validate pagination
export const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(page) || parseInt(page) < 1)) {
    return res.status(400).json({ message: 'Số trang không hợp lệ' });
  }
  
  if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({ message: 'Giới hạn phải từ 1 đến 100' });
  }
  
  next();
};

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function isValidObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Sanitize input để tránh XSS
export const sanitizeInput = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Loại bỏ các ký tự nguy hiểm
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .trim();
      }
    });
  }
  next();
};
