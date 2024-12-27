const logout = (req, res, next) => {
  if (!req.isAuthenticated()) {
    // Nếu người dùng chưa đăng nhập, thông báo chưa login
    return res.redirect('/login?message=Bạn chưa login')
  }

  req.logout((err) => {
    if (err) {
      return next(err)
    }

    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }
      // Sau khi logout thành công, chuyển đến trang login và hiển thị thông báo thành công
      return res.redirect('/login?message=Bạn đã logout thành công')
    })
  })
}

module.exports = {
logout}
