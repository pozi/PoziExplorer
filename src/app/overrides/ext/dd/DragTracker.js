// Reasons for override:
// - fixing IE9 issue of slider not sliding properly (based on post: http://www.sencha.com/forum/showthread.php?141254-Ext.Slider-not-working-properly-in-IE9 ) 

Ext.dd.DragTracker.prototype.onMouseMove = function(e, target){
  // HACK: IE hack to see if button was released outside of window. Resolved in IE9.
  var ieCheck = Ext.isIE6 || Ext.isIE7 || Ext.isIE8;

  //
  var isIE9 = Ext.isIE && (/msie 9/.test(navigator.userAgent.toLowerCase())) && document.documentMode != 6;
  
  if(this.active && ieCheck && !isIE9 && !e.browserEvent.button){
    e.preventDefault();
    this.onMouseUp(e);
    return;
  }

  e.preventDefault();
  var xy = e.getXY(), s = this.startXY;
  this.lastXY = xy;
  if(!this.active){
    if(Math.abs(s[0]-xy[0]) > this.tolerance || Math.abs(s[1]-xy[1]) > this.tolerance){
	this.triggerStart(e);
    }else{
	return;
    }
  }
  this.fireEvent('mousemove', this, e);
  this.onDrag(e);
  this.fireEvent('drag', this, e);
};