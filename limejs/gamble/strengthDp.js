goog.provide("gamble.strengthDp");

goog.require("lime.Sprite");

gamble.strengthDp = function(x, y) {
	goog.base(this);

	this.setSize(174, 28).
		setPosition(x, y).
		setAnchorPoint(0, 0);

	/*
	this.placeHolder = new lime.Sprite().
		setSize(174, 28).
		setPosition(0, 0).
		setAnchorPoint(0, 0).
		setFill("/assets/StrengthBar1.png");

	this.fill = new lime.Sprite().
		setSize(tywa.STRENGTH_W-6, tywa.STRENGTH_H-6).
		setPosition(3, 3).
		setAnchorPoint(0, 0).
		setFill(ui.spriteSheet.getFrame("StrengthBar2.png"));
	*/	

	this.scoreDp = new lime.Label().
		setAlign('center').
		setAnchorPoint(0, 0).
		setPosition(0, 30).
		setFontColor('#fff').
		setFontSize(12).
		setText("Word Score: 12").
		setFontWeight("bold").
		setSize(130, 20);

	/*
	this.mask = new lime.Sprite().
		setAnchorPoint(0, 0).
		setSize(tywa.STRENGTH_W-6, tywa.STRENGTH_H-6).
		setPosition(3, 3);

	this.fill.setMask(this.mask);
	*/

	//this.appendChild(this.placeHolder);
	//this.appendChild(this.mask);
	//this.appendChild(this.fill);
	this.appendChild(this.scoreDp);

	// Since we're temporarily using the timer graphic as our word-strength indicator
	var cumulativeProbs = [0.000000, 0.000000, 0.000605, 0.003467, 0.013989, 0.038353, 0.087564, 0.173247, 0.285215, 0.421870, 0.549789, 0.664364, 0.757720, 0.827573, 0.879875, 0.917489, 0.945400, 0.963139, 0.976469, 0.983968, 0.988658, 0.991843, 0.993563, 0.994759, 0.995834, 0.996681, 0.997420, 0.998266, 0.998831, 0.999167, 0.999315, 0.999476, 0.999543, 0.999637, 0.999772, 0.999906, 0.999933, 0.999933, 0.999933, 0.999946, 0.999946, 0.999946, 0.999946, 0.999960, 0.999960, 1.000000];

	this.updateScore = function(score) {
		
		// this.mask.setSize(cumulativeProbs[score] * (tywa.STRENGTH_W-6), tywa.STRENGTH_H-6);
		this.scoreDp.setText("Word Score: " + score);
	}
}

goog.inherits(gamble.strengthDp, lime.Sprite);
