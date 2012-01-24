define([
	"dojo/_base/declare",
	"davinci/html/ui/CSSOutline",
	"davinci/ui/widgets/DavinciModelTreeModel"
], function(declare, CSSOutline, DavinciModelTreeModel){

declare("davinci.html.ui.CSSOutline", null, {
	constructor : function (model)
	{
		this._cssModel=model;
	},
	
	getModel : function()
	{
		this._model=new davinci.html.ui.CSSOutlineModel(this._cssModel);
		return this._model;
	}
});

declare("davinci.html.ui.CSSOutlineModel", DavinciModelTreeModel, {

	_childList: function(item)
	{
	    var children=[];
		switch (item.elementType)
		{
		case "CSSFile":
			children=item.children;
			break;
		case "CSSRule":
			children=item.properties;
			break;
			default:
//				children=null;
		}
		
		return children;
	}
});
});
