var app = angular.module('findyourbias', []);
var socket = io.connect({ path: '/result/socket.io/' });

app.controller('statsCtrl', function($scope, $http, $timeout){
  $scope.votes = [];
  $scope.total = 0;
  $scope.analysis = null;
  $scope.conversationHistory = [];
  $scope.chat = { userMessage: "" };

  var scrollToBottom = function() {
    $timeout(function() {
      var chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }, 0, false);
  };

  var updateScores = function(){
    socket.on('scores', function (json) {
       $scope.$apply(function () {
         $scope.votes = JSON.parse(json);
         $scope.total = $scope.votes.length;
       });
    });
  };

  $scope.getAnalysis = function() {
    $scope.analysis = "Loading AI analysis...";
    $scope.conversationHistory = []; // Reset history
    var url = "result/api/analyze";
    
    $http.get(url).then(function(response) {
        var initialAnalysis = response.data.analysis;
        $scope.analysis = initialAnalysis; // Keep analysis for ng-if
        $scope.conversationHistory.push({role: 'assistant', content: initialAnalysis});
        scrollToBottom();
    }).catch(function(error) {
        console.error("Error fetching analysis:", error);
        $scope.analysis = "Failed to get analysis. Could not reach the backend.";
    });
  };

  $scope.sendChatMessage = function() {
    if (!$scope.chat.userMessage.trim()) return;

    var userMsg = {role: 'user', content: $scope.chat.userMessage};
    $scope.conversationHistory.push(userMsg);
    scrollToBottom();

    var chatUrl = "result/api/chat";
    var payload = {
      question: $scope.chat.userMessage,
      history: $scope.conversationHistory.slice(0, -1) // Send history without the new user message
    };

    $scope.chat.userMessage = ""; // Clear input field

    $http.post(chatUrl, payload).then(function(response) {
      var assistantMsg = {role: 'assistant', content: response.data.response};
      $scope.conversationHistory.push(assistantMsg);
      scrollToBottom();
    }).catch(function(error) {
      console.error("Error sending chat message:", error);
      var errorMsg = {role: 'assistant', content: "Sorry, I couldn't get a response."};
      $scope.conversationHistory.push(errorMsg);
      scrollToBottom();
    });
  };

  var init = function(){
    document.body.style.opacity=1;
    updateScores();
  };
  socket.on('message',function(data){
    init();
  });
});
