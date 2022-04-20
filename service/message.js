class MessageService {
  constructor(io, socket) {
    this.socket = socket;
    this.io = io;
  }

  getDocuments = "get-documents";
  loadDocuments = "load-documents";
  invalidToken = "invalid-token";
  verifyToken = "verify-token";
  verifiedTokenSuccess = "verified-token"; //
  getDocument = "get-document";
  confirmEmail = "confirm-email";
  confirmEmailSuccess = "confirm-email-success";
  confirmEmailFailure = "confirm-email-failure";
  changePassword = "change-password";
  changePasswordSuccess = "change-password-success";
  changePasswordFailure = "change-password-failure";
  registerUser = "register-user";
  registerUserSuccess = "register-user-success";
  registerUserFailure = "register-user-failure";
  loginUser = "login-user";
  loginUserSuccess = "login-user-success";
  loginUserFailure = "login-user-failure";
  updateAccount = "update-account";
  updateAccountSuccess = "update-account-success";
  updateAccountFailure = "update-account-failure";
  forgotPassword = "forgot-password";
  forgotPasswordSuccess = "forgot-password-success";
  forgotPasswordFailure = "forgot-password-failure";
  verifyForgotPasswordCode = "verify-forgot-password-code";
  verifyForgotPasswordCodeSuccess = "verify-forgot-password-code-success";
  verifyForgotPasswordCodeFailure = "verify-forgot-password-code-failure";
  verifyResetPasswordCode = "verify-reset-password-code";
  verifyResetPasswordCodeSuccess = "verify-reset-password-code-success";
  verifyResetPasswordCodeFailure = "verify-reset-password-code-failure";
  resetPassword = "reset-password";
  resetPasswordSuccess = "reset-password-success";
  resetPasswordFailure = "reset-password-failure";
  deleteDocument = "delete-document";
  deleteDocumentSuccess = "document-deleted"; //
  deleteDocumentFailure = "unauthorized-document-delete"; //
  deletePermanently = "delete-permanently";
  deletePermanentlySuccess = "delete-permanently-success";
  deletePermanentlyFailure = "delete-permanently-failure";
  disconnect = "disconnect";

  sendMessage(message, ...data) {
    this.socket.emit(message, ...data);
  }

  onReceiveMessage(message, callback) {
    this.socket.on(message, callback);
  }
}

const messageService = new MessageService("", "");

console.log(messageService.getDocuments);

/*

"get-documents",
"load-documents",
"invalid-token"
"get-document",
"verify-token",
"verified-token",
"invalid-token"
"confirm-email",
"confirm-email-success",
"confirm-email-failure"
"change-password",
"change-password-success",
"change-password-failure",
"register-user",
"register-user-success",
"user-registered-failure",
"login-user",
"login-success",
"login-failure",
"update-account",
"update-account-success",
"update-account-failure",
"forgot-password",
"forgot-password-success",
"forgot-password-failure",
"verify-forgot-password-code",
"verify-forgot-password-code-success",
"verify-forgot-password-code-failure",
"verify-reset-password-code",
"verify-reset-password-code-failure",
"reset-password",
"reset-password-success",
"reset-password-failure",
"delete-document",
"document-deleted",
"unauthorized-document-delete",
"delete-permanently",
"user-deleted", deleted.message);
    }
    return emitToSocket("delete-permanently-failure",
"disconnect",

*/
