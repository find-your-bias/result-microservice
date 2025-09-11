var app = angular.module('findyourbias', []);
var socket = io.connect({ path: '/result/socket.io/' });

app.controller('statsCtrl', function($scope, $http){
  $scope.votes = [];
  $scope.total = 0;
  $scope.analysis = null;
  $scope.conversationHistory = [];
  $scope.userMessage = "";

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
    }).catch(function(error) {
        console.error("Error fetching analysis:", error);
        $scope.analysis = "Failed to get analysis. Could not reach the backend.";
    });
  };

  $scope.sendChatMessage = function() {
    if (!$scope.userMessage.trim()) return;

    var userMsg = {role: 'user', content: $scope.userMessage};
    $scope.conversationHistory.push(userMsg);

    var chatUrl = "result/api/chat";
    var payload = {
      question: $scope.userMessage,
      history: $scope.conversationHistory.slice(0, -1) // Send history *before* this message
    };

    $scope.userMessage = ""; // Clear input field

    $http.post(chatUrl, payload).then(function(response) {
      var assistantMsg = {role: 'assistant', content: response.data.response};
      $scope.conversationHistory.push(assistantMsg);
    }).catch(function(error) {
      console.error("Error sending chat message:", error);
      var errorMsg = {role: 'assistant', content: "Sorry, I couldn't get a response."};
      $scope.conversationHistory.push(errorMsg);
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
