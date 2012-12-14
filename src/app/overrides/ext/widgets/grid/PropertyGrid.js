// Overriding the behaviour of the property column model because it HTML encodes everything
// This is where we can format cell content, regardless of the name of the property to render, but based on the content of its value
// If we knew the name of the property in advance, we could use PropertyGrid custom renderers
// Based on the source code: http://docs.sencha.com/ext-js/3-4/source/Column.html
// TODO: this is a good candidate for a custom type extending the PropertyGrid if we find ourselves modifying its core functionalities anymore	

var photoLink;

Ext.grid.PropertyColumnModel.prototype.renderCell = function(val, meta, rec){
  var renderer = this.grid.customRenderers[rec.get('name')], doNotHTMLEncode = false, rv = val;
  if(renderer){
    return renderer.apply(this, arguments);
  }
  if (val && (val.search(/\page_Id/)>-1 || val.search(/\Page_Id/)>-1 || val.search(/\Page_id/)>-1)){
  	photoLink = val;
  }
  if(Ext.isDate(val)){
    rv = this.renderDate(val);
  }else if(typeof val === 'boolean'){
    rv = this.renderBool(val);
  }else if(val){
    if (val.search(/^http/)>-1){
      if (val.search(/\.jpg/)>-1)
      {
      	if(!photoLink){
      		rv ="<a href='"+val+"' target='_blank'><img src='"+val+"' style='display:block; max-height:150px; max-width:230px; height:auto; margin-right:auto;' /></a>";
      	}
      	else
          rv ="<a href='"+photoLink+"' target='_blank'><img src='"+val+"' style='display:block; max-height:150px; max-width:230px; height:auto; margin-right:auto;' /></a>";
          photoLink = null;
      }
      else
      {
        var linkName=val.split("/").pop();
        if (linkName.length<1) {linkName = 'link';}
        if (linkName.length>20) {linkName = 'link';}
        rv ="<a href='"+val+"' target='_blank'>"+linkName+"</a>";
      }
      doNotHTMLEncode = true;
    }else	{
      try {
        // Decoding those strings that have been URI-encoded
        rv = decodeURI(val);
      }
      catch (e)
      {
        // Or presenting them as is, if they can't be decoded
        rv = val;
      }
      // Converting line returns to HTML line breaks (needs to be after URI-decoding)
      rv=rv.replace(/\n/g, '<br />');
      
      // Better presentation of boolean values (they are not detected as boolean in the tests above)
      if (val == "true")  {rv="<input type='checkbox' name='a' value='a' checked='checked' disabled='disabled'/>";}
      if (val == "false") {rv="<input type='checkbox' name='b' value='b' disabled='disabled'/>";}
      
      // Presentation of email addresses
      if (/^[-+.\w]{1,64}@[-.\w]{1,64}\.[-.\w]{2,6}$/.test(val))
      {
        rv="<a href='mailto:"+val+"'>"+val+"</a>";
      }
      
      // We HTML-encode nothing!
      doNotHTMLEncode = true;
    }
  }
  if (doNotHTMLEncode)
  {return rv;}
  else
  {return Ext.util.Format.htmlEncode(rv);}
};
