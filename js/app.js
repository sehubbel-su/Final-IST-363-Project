(function(){
    
    //Create a module
    let app = angular.module('app', ['ui.router', 'istAuth']);


    //Config Block
    app.config(function($stateProvider, $urlRouterProvider) {
        //Configure the routes for the application
		$stateProvider
			.state('index', {
				url: '',
				templateUrl: '/templates/index.html',
				controller: 'indexCtrl'
            }).state('feed', {
                url: '/feed',
                templateUrl: "/templates/feed.html",
                controller: "feedCtrl"
            }).state('feedItem', {
                url: '/feed/:id',
                templateUrl: "/templates/feed-item.html",
                controller: "feedItemCtrl"
            }).state('upload', {
                url: '/upload',
                templateUrl: "/templates/upload.html",
                controller: "uploadCtrl"
            }).state('profile', {
                url: '/profile/:id',
                templateUrl: "/templates/profile.html",
                controller: "profileCtrl"
            });
        
        //If the user requests a URL that isn't mapped to a route, redirect them to the homepage
        $urlRouterProvider.otherwise('index');
	});


    //Run Block
    app.run(function($rootScope, $auth, $state){
        //Globally available functions to toggle Bootstrap modals
        $rootScope.openModal = function(selector) {
            $(selector).modal('show');
        };

        $rootScope.closeModal = function(selector) {
            $(selector).modal('hide');
        };

        //Check to see if the user is already logged in. If not, redirect to the homepage
        var isLoggedIn = $auth.checkAuth();
        if(!isLoggedIn) {
            $state.go('index');
        }
        //If user is already logged in, set the $rootScope.user and $rootScope.token objects
        $auth.loginFromSaved();
    });

    //Controllers
    app.controller('indexCtrl', function(){
        //Controller logic here
    });

    app.controller('feedCtrl', function($scope, $rootScope, $http, $state){
        $scope.page = 1;
        $scope.feedItems = []
        $scope.hasMoreImages = true;

        $scope.updateHasMoreImages = function () {
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/media',
                method: 'GET',
                params: {
                    'token': $rootScope.token,
                    'count': 12,
                    'page': $scope.page
                }
            }).then(function(response){
                
                if(response.data.data.length == 0)
                {
                    $scope.hasMoreImages = false;
                }

            }, function(response){

                console.log('failed');
                console.log(response);

            });
        }

        $scope.loadTwelve = function(){
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/media',
                method: 'GET',
                params: {
                    'token': $rootScope.token,
                    'count': 12,
                    'page': $scope.page
                }
            }).then(function(response){
                response.data.data.forEach(function(element)
                {
                    $scope.feedItems.push(element);
                });
                $scope.updateHasMoreImages();
                console.log($scope.feedItems);
            }, function(response){

                console.log('login faied');
                console.log(response);

            });
        }


        $scope.loadTwelve();
        $scope.page++;

        $scope.loadMore = function(){
            $scope.loadTwelve();
            $scope.page++;
        }

        $scope.openFeedItem = function(item) {
            console.log(item);
            $state.go("feedItem", {"id": item.id}); 
        }

    });

    app.controller('feedItemCtrl', function($state, $stateParams, $http, $rootScope, $scope){
        console.log("Your id is " + $stateParams.id);
        $http({
            url: 'https://exchangeagram.azurewebsites.net/api/media',
            method: 'GET',
            params: {
                'token': $rootScope.token,
                'id': $stateParams.id, 
                'page': $scope.page
            }
        }).then(function(response){
            console.log(response);
            $scope.feedItem = response.data.data[0];
            $scope.caption = $scope.feedItem.caption;
            $scope.itemUsername = $scope.feedItem.user.username;
            $scope.itemLikes = $scope.feedItem.likes;
            $scope.itemEdit = $scope.feedItem.edit;
            $scope.comments = $scope.feedItem.comments;
            $scope.hasComments = $scope.feedItem.comments.length > 0;
            $scope.userHasLiked = $scope.feedItem.user_has_liked;
    
        }, function(response){

            console.log('login faied');
            console.log(response);

        });

        $scope.doLike = function() {
            console.log('test');
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/like',
                method: 'POST',
                params: {
                    'token': $rootScope.token,
                    'id': $stateParams.id
                }
            }).then(function(response){
                console.log(response);
                $scope.itemLikes++;
                $scope.userHasLiked = true;
            })
        }

        $scope.doUnLike = function() {
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/like/delete',
                method: 'POST',
                params: {
                    'token': $rootScope.token,
                    'id': $stateParams.id
                }
            }).then(function(response){
                console.log(response);
                $scope.itemLikes--;
                $scope.userHasLiked = false;
                
            })
        }

        // $scope.deletePost = function(delete) {
        //     $http({
        //         url: 'https://exchangeagram.azurewebsites.net/api/media/delete',
        //         method: 'POST',
        //         params: {
        //             'token':$rootScope.token,
        //             'id': $stateParams.id
        //         }
        //     }).then(function(response){
        //         console.log(response);
        //         $rootScope.closeModal('#modal_edit_post');
            
        //     })
        // }

        $scope.editCaption = function(caption) {
            console.log(caption);
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/media/update',
                method: 'POST',
                params: {
                    'token':$rootScope.token,
                    'id': $stateParams.id,
                    'caption': caption
                }
            }).then(function(response){
                console.log(response);
                $rootScope.closeModal('#modal_edit_post');
            
            })
        }

        $scope.addNewComment = function(comment) {
            console.log(comment);
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/comment',
                method: 'POST',
                params: {
                    'token': $rootScope.token,
                    'media_id': $stateParams.id,
                    'comment': comment
                }
            }).then(function(response){
                $http({
                    url: 'https://exchangeagram.azurewebsites.net/api/media',
                    method: 'GET',
                    params: {
                        'token': $rootScope.token,
                        'id': $stateParams.id, 
                        'page': $scope.page
                    }
                }).then(function(response){
                    console.log(response);
                    $scope.comments = response.data.data[0].comments;
                }, function(response){
        
                    console.log('login faied');
                    console.log(response);
        
                });
                
            })
        }
        

    });


    app.controller('uploadCtrl', function($scope, $rootScope, $state){
        $scope.token = $rootScope.token;
        console.log($scope.token);
    });

    app.controller('profileCtrl', function($scope, $rootScope, $http, $state, $stateParams){
        $scope.page = 1;
        $scope.profileItems = []
        $scope.hasMoreImages = true;
        $scope.bio = $rootScope.auth.bio;
        $scope.profile = $rootScope.auth.username;

        $scope.updateHasMoreImages = function () {
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/media',
                method: 'GET',
                params: {
                    'token': $rootScope.token,
                    'count': 12,
                    'page': $scope.page
                }
            }).then(function(response){
                
                if(response.data.data.length == 0)
                {
                    $scope.hasMoreImages = false;
                }

            }, function(response){

                console.log('failed');
                console.log(response);

            });
        }

        $scope.editProfile = function(newInfo) {
            console.log(username);
            console.log(bio);
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/user',
                method: 'GET',
                params: {
                    'token':$rootScope.token,
                    'id': $stateParams.id
                }
            }).then(function(response){
                console.log(response);
                $rootScope.closeModal('#modal_edit_profile');
            
            })
        }

        $scope.loadTwelve = function(){
            $http({
                url: 'https://exchangeagram.azurewebsites.net/api/media',
                method: 'GET',
                params: {
                    'token': $rootScope.token,
                    'count': 12,
                    'page': $scope.page,
                    'user_id': $stateParams.id
                }
            }).then(function(response){
                response.data.data.forEach(function(element)
                {
                    $scope.profileItems.push(element);
                });
                $scope.updateHasMoreImages();
                console.log($scope.profileItems);
            }, function(response){

                console.log('login faied');
                console.log(response);

            });
        }


        $scope.loadTwelve();
        $scope.page++;

        $scope.loadMore = function(){
            $scope.loadTwelve();
            $scope.page++;
        }

        $scope.openItem = function(item) {
            console.log(item);
            $state.go("profileItem", {"id": item.id});
            $scope.userProfile = response.data.data[0].id; 
        }

    });

    app.controller('mainCtrl', function($scope, $auth, $rootScope, $state, $stateParams){

        $scope.avatar = function () {
            $http({
                url: "/images/default_profile.png"
            })
        }

        $scope.log_user_in = function() {

            $auth.login($scope.username, $scope.password, function() {
                console.log('user logged in successfully'),
                $rootScope.closeModal('#modal_login');
            });
        }

        $scope.log_user_out = function() {
            $auth.logout();
        }

        $scope.gofeed = function () {
            $state.go('feed');
        }

        $scope.goupload = function () {
            $state.go('upload');
        }

        $scope.goprofile = function() {
            $state.go("profile", {"id": $rootScope.auth.id}); 
        }

        

    });

    //Components
    app.component('mainHeader', {
        templateUrl: '/templates/main-header.html',
        controller: 'mainCtrl'
    })
    
    app.component('mainFooter', {
        templateUrl: '/templates/main-footer.html'
    });
    

})();