export const sendSuccess = (res, message, data = null, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    ...(data !== null && { data }),
  });
};

export const ok = (res, data = null, status = 200, message = "Success") => {
  return res.status(status).json({
    success: true,
    message,
    ...(data !== null && { data }),
  });
};
