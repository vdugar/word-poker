goog.provide("tywa.timer");

goog.require("lime.Sprite");
goog.require("lime.animation.Resize");

tywa.timer = function(width, x, y) {
	goog.base(this);

	width = 119;
	this.placeHolder = new lime.Sprite().
		setSize(width, 34).
		setPosition(0, 0).
		setAnchorPoint(0, 0).
		setFill(ui.spriteSheet.getFrame("TimeBar1.png"));

	this.fill = new lime.Sprite().
		setSize(89, 12).
		setPosition(24, 10).
		setAnchorPoint(0, 0).
		setFill(ui.spriteSheet.getFrame("TimeBar2.png"));

	this.placeHolder.appendChild(this.fill);

	this.setSize(width, 34).
		setPosition(x, y).
		setAnchorPoint(0, 0);

	this.w = width;
	this.h = 34;

	this.appendChild(this.placeHolder);

	this.countdown = function(seconds) {
		this.resize = new lime.animation.Resize(0, 12).setDuration(seconds);
		this.fill.runAction(this.resize);

		goog.events.listen(this.resize, lime.animation.Event.STOP, this.stopHandler);
	}

	this.stopHandler = function() {
		tywa.state.betTimerExpired();
		this.targets[0].parent_.parent_.parent_.disableTimer();
	}

	this.restoreSize = function() {
		this.fill.setSize(89, 12);
	}

	this.stopAnimation = function() {
		if(this.resize)
			this.resize.stop();
	}

	this.removeListener = function() {
		goog.events.unlisten(this.resize, lime.animation.Event.STOP, this.stopHandler);
	}
}

goog.inherits(tywa.timer, lime.Sprite);