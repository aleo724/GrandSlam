//時間表示用の関数
//普通に割り算するとIEEE754のアレで・・・
var sprintf = function (t) {
	var s = Math.floor(t/1000);
	var ss = t - s*1000;
	var str = "";
	if (ss < 10) {
		str = "00" + ss;
	} else if (ss < 100){
		str = "0" + ss;
	} else {
		str = ss;
	}
	return s + "." + str;
};

//デフォルトの時間
var TIME_LIMIT = 60000;
//ステージ数(5ステージ)
var STAGE = 5;
//プレーヤー
var Player = Backbone.Model.extend({
	defaults: {
		name            : "",
		time_limit      : TIME_LIMIT,
		time            : TIME_LIMIT,
		timeId          : null,
		time_stored     : 0,
		isActive        : false
	},
	//時間を進める
	countdown: function () {
		var self = this;
		var nowDate = new Date().getTime();
		var nowTime = this.get('time');
		this.timeId = setInterval(function () {
			if(self.get('time')>0){
				var nd = new Date().getTime();
				var delta = (nd - nowDate);
				var newTime = (nowTime - delta > 0) ? nowTime - delta : 0;
				self.set('time', newTime);
			}	
		},10);
	},
	//時計のスタート
	start: function () {
		this.set('isActive',true);
		this.countdown();
	},
	//時計のストップ
	stop: function () {
		this.set('isActive',false);
		clearInterval(this.timeId);
	},
	//時計のリセット
	reset: function () {
		this.set('isActive',false);
		clearInterval(this.timeId);
		this.set('time',this.get('time_limit'));
	},
	//稼いだ時間をstoreする
	storeTime: function () {
		this.set('time_stored', this.get('time_stored')+this.get('time'));
	},
	//storeした時間を加算する
	addStoredTime: function () {
		this.set('time', this.get('time')+this.get('time_stored'));
	}
});

var Field = Backbone.Collection.extend({
	model: Player,
	nowGoing: 0,
	stage: 1,

	initialize: function (names) {
		var _this = this;
		_.each(names, function (n) {
			_this.create({name: n});
		});
	},
	//ゲームスタート
	startGame: function () {
		var isGoing = false;
		this.each(function (player) {
			isGoing = isGoing || (player.get('isActive'));
		});
		if(!isGoing) this.at(this.nowGoing).start();
	},
	//プレーヤーの手番を替える
	shiftPlayer: function() {
		var isZero = false;
		this.each(function (player) {
			isZero = isZero || (player.get('time') === 0);
		});
		if(!isZero){
			this.nowGoing = (this.nowGoing + 1 < this.length) ? this.nowGoing + 1 : 0;
			this.each(function (player) {
				if(player.get('isActive')) player.stop();
			});
			this.at(this.nowGoing).start();
		}
	},
	//スタートするプレーヤーを替える
	shiftStart: function () {
		var isGoing = false;
		this.each(function (player) {
			isGoing = isGoing || (player.get('isActive'));
		});
		if(!isGoing) this.nowGoing = (this.nowGoing + 1 < this.length) ? this.nowGoing + 1 : 0;
	},
	//次のステージに移る
	goNextStage: function () {
		this.each(function (player) {
			player.storeTime();
			player.reset();
		});
		this.stage += 1;
		console.log(this.stage);
	},
	
	addStoredTime: function () {
		this.each(function (player) {
			player.addStoredTime();
		});
	},

	stop: function () {
		this.each(function (player) {
			player.stop();
		});
	},

	reset: function () {
		this.each(function (player) {
			player.reset();
		});
	}
});

var PlayerView = Backbone.View.extend({
	tagName: "div",

	template: _.template($('#tmpl-playerview').html()),

	events: {
	},

	initialize: function () {
		this.listenTo(this.model, 'change', this.render);
	},

	render: function () {
		this.$el.html(this.template(this.model.toJSON()));
		this.$el.addClass('player');
		this.$el.toggleClass('active', this.model.get('isActive'));
		return this;
	}
});

var FieldView = Backbone.View.extend({
	events: {
		'keydown': 'onKeyPress'
	},

	initialize: function () {},

	_addOne: function (player) {
		var view = new PlayerView({model: player});
		$('#scoreboard').append(view.render().el);
	},

	render: function () {
		$('#stage').empty();
		$('#scoreboard').empty();
		$('#stage').text("Set " + this.collection.stage+"      Move: " + this.collection.at(this.collection.nowGoing).get('name'));
		this.collection.each(this._addOne, this);
	},

	onKeyPress: function (e) {
		switch(e.keyCode){
			case 32: //space
				this.collection.startGame();
				break;
			case 39: //->
				this.collection.shiftPlayer();
				break;
			case 78: //n
				this.collection.goNextStage();
				break;
			case 65: //a
				this.collection.addStoredTime();
				break;
			case 83: //s
				this.collection.shiftStart();
				break;
			case 82: //r
				this.collection.reset();
				break;
			case 84: //t
				this.collection.stop();
				break;
			default:
				break;
		}
		this.render();
	}
});
$("#get").click(function(){
	var p1 = $("#player1").val();
	var p2 = $("#player2").val();
	var t = parseInt($("#time").val(),10) * 1000;
	var Fld = new Field();
	var App = new FieldView({el:'body', collection:Fld});
	Fld.add([{name: p1, time: t, time_limit : t},{name: p2, time: t, time_limit: t}]);
	App.render();
	$("#get").blur();
	return false;
});
