define([
	"dojo/_base/declare",
	"davinci/ui/ModelEditor",
	"davinci/html/HTMLModel",
	"davinci/html/ui/HTMLOutline"
], function(declare, ModelEditor, HTMLModel, HTMLOutline){

return declare("davinci.html.ui.HTMLEditor", ModelEditor, {

    constructor : function (element) {
        this.htmlFile=davinci.model.Factory.newHTML();
        this.model=this.htmlFile;
//      this.inherited(arguments);
    },

    destroy : function () {
        this.htmlFile.close();
        this.inherited(arguments);
    },

    getOutline : function () {
        if (!this.outline)
            this.outline=new davinci.html.ui.HTMLOutline(this.model);
        return this.outline;
    },

    getDefaultContent : function () {
        return "<html>\n <head></head>\n <body></body>\n</html>";
    }

});
});


