requirejs.config({
    baseUrl: 'static/js'
});

function apiCall(path, method, params, callback) {
    var request = $.ajax({
      url: path,
      type: method,
      async: true,
      dataType: "json",
      data: JSON.stringify(params),
      contentType: 'application/json;charset=UTF-8',
    });
    request.success(callback);
}

function byteToString(bytearray) {
  var result = new Array(bytearray.length);
  for (var i = 0; i < bytearray.length; i++) {
    result[i] = String.fromCharCode(bytearray[i]);
  }
  return result.join('');
}

// Main
$(document).ready(function() {
  // Configures login dropdown menu
  $('.dropdown-menu').click(function(event) {
    event.stopPropagation();
  });

  // Login btn
  $('.login-btn').click(function(e) {
    var username = $(this).parent().find('.login-username').val();
    //var password = $(this).parent().find('.login-password').val();

    apiCall('/api/login', 'POST', {username: username}, function(data) {
      if (!data.ok) {
          $.notify(data.error, 'error');
          return;
      }

      // Redirecting the user to the frontpage
      window.location.replace('/');
    });

  });

  // Signup btn
  $('#signup-btn').click(function(e) {
    var email = $('#signup-email').val();
    var username = $('#signup-username').val();
    var password = $('#signup-password').val();

    apiCall('/api/signup', 'POST', {email: email, username:username, password: password}, function(data) {
      if (!data.ok) {
          $.notify("Invalid sign-up information. Please try again !", 'error');
          return;
      }

      // Redirecting the user to the frontpage
      window.location.replace('/');
    });

  });

  // Logout link
  $('a.logout').click(function() {
    apiCall('/api/logout', 'POST', {}, function(data) {
      console.log('okdsokfs');
      // Redirecting the user to the frontpage
      window.location.replace('/');
    });
  })

    //testGetShader();
});
