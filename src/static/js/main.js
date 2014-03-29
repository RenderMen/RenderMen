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

// Main
$(document).ready(function() {
    // Configures login dropdown menu
    $('.dropdown-menu').click(function(event) {
      event.stopPropagation();
    });

    // Login btn
    $('#login-btn').click(function() {
      var email = $('#login-email').val();
      var password = $('#login-password').val();

      apiCall('/api/login', 'POST', {email: email, password: password}, function(data) {
        if (!data.ok) {
          return;
        }

        // Redirecting the user to the frontpage
        window.location.replace('/');
      });

    });

    // Logout link
    $('a.logout').click(function() {
      apiCall('/api/logout', 'POST', {}, function(data) {
        // Redirecting the user to the frontpage
        window.location.replace('/');
      });
    })

    //testGetShader();
});
