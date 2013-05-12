// Set main namespace
goog.provide("tywa.table");

goog.require("lime.Director");
goog.require("lime.Scene");
goog.require("lime.Layer");
goog.require("lime.fill.LinearGradient");
goog.require("goog.math");
goog.require("lime.GlossyButton");

tywa.table = function() {
	goog.base(this);

	var tableBg = new lime.Sprite().
    setSize(960, 640).
    setFill('/assets/bg.png').
    setPosition(0, 0).
    setAnchorPoint(0,0);

	this.setPosition(0, 0).
	    setRenderer(lime.Renderer.CANVAS).
	    setAnchorPoint(0,0);   
	    
	this.appendChild(tableBg); 
}

goog.inherits(tywa.table, lime.Layer);






