define([
	"exports",
	"davinci/model/Model"
], function(exports){

// FIXME: these are globals
var pushComment = null;
var pushLabel = null;

if (!davinci.js) {
    davinci.js = {};
}

/**
 * @class davinci.js.JSElement
 * @constructor
 * @extends davinci.model.Model
 */
exports.JSElement = function() {

    this.inherits(davinci.model.Model);
    this.elementType = "JSElement";
    if (pushComment != null) {
        this.comment = pushComment;
        pushComment = null;

    }
    if (pushLabel != null) {
        this.label = pushLabel;
        pushLabel = null;
    }
};

davinci.Inherits(exports.JSElement, davinci.model.Model);

exports.JSElement.prototype.printNewLine = function(context) {
    var s = "\n";
    for ( var i = 0; i < context.indent; i++ )
        s = s + " ";
    return s;
};

exports.JSElement.prototype.printStatement = function(context, stmt) {

    return this.printNewLine(context) + stmt.getText(context)
            + (stmt.nosemicolon ? "" : ";");
};

exports.JSElement.prototype.add = function(e) {
    this.addChild(e);
};

exports.JSElement.prototype.init = function(start, stop, name) {

};

exports.JSElement.prototype.getLabel = function() {
    context = {};
    context.indent = 0;
    return this.getText(context);
};

exports.JSElement.prototype.getID = function() {
    return this.parent.getID() + ":" + this.startLine + ":" + this.getLabel();
};

exports.JSElement.prototype.getSyntaxPositions = function(lineNumber) {
    var positions = [];

    function add(line, col, length, type) {
        if ((typeof lineNumber == "undefined") || lineNumber == line)
            positions.push({
                line : line,
                col : col,
                length : length,
                type : type
            });
    }

    function add2(pos, length, type) {
        if ((typeof lineNumber == "undefined") || lineNumber == pos[0])
            positions.push({
                line : pos[0],
                col : pos[1],
                length : length,
                type : type
            });
    }
    var visitor = {

        visit : function(node) {
            if (node.elementType == "Function") {
                add(node.startLine, node.startCol, 8, "keyword");
                add2(node.leftParenPos, 1, "delimiter");
                add2(node.rightParenPos, 1, "delimiter");
                add2(node.leftBracePos, 1, "delimiter");
                add2(node.rightBracePos, 1, "delimiter");
            } else if (node.elementType == "VariableDeclaration") {
                add(node.startLine, node.startCol, 3, "keyword");
            } else if (node.elementType == "VariableFragment") {
                if (node.equalPos)
                    add2(node.equalPos, 1, "operator");
                else
                    add(node.startLine, node.startCol, 1, "name");
            } else if (node.elementType == "NameReference") {

                add(node.startLine, node.startCol, node.endCol - node.startCol,
                        "name");

            }

        },
        endVisit : function(node) {
            return true;
        }
    };
    this.visit(visitor);
    return positions;
};

// dojo.declare("davinci.js.JSElement", davinci.model.Model, {
// elementType : "JSElement",
// 
// add : function(e){
// this.addChild(e);
// }
// }
// );

/**
 * @class davinci.js.JSFile
 * @constructor
 * @extends davinci.js.JSElement
 */
exports.JSFile = function(origin) {

    this.inherits(exports.JSElement);
    this.elementType = "JSFile";
    this.nosemicolon = true;
    this._textContent = "";
    // id only, never loaded
    if (origin)
        this.origin = origin;

};
davinci.Inherits(exports.JSFile, exports.JSElement);

exports.JSFile.prototype.getText = function(context) {
    return this._textContent;
};

exports.JSFile.prototype.setText = function(text) {
    this._textContent = text;
};

exports.JSFile.prototype.getLabel = function() {
    return this.fileName;
};

exports.JSFile.prototype.getID = function() {
    return this.fileName;
};

exports.JSFile.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren)
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    if (visitor.endVisit)
        visitor.endVisit(this);

};
//
// exports.JSFile.prototype.getSyntaxPositions = function(lineNumber){
// var positions
// =exports.JSElement.prototype.getSyntaxPositions.apply(this,[lineNumber]);
//	
//
// for (var i=0;i<this.errors.length;i++)
// {
// var line=this.errors[i].line;
// if ((typeof lineNumber =="undefined") || lineNumber==line)
// positions.push({line:line,col:this.errors[i].character,length:this.errors[i].length,
// type:"error"});
// }
//	
// return positions;
// }

// dojo.declare("exports.JSFile", exports.JSElement, {
// elementType : "JSFile",
//	
// getText : function () {},
// setText : function (text) {
// exports.JSElement.parse(text,this);
// }
//
//	
// });

/**
 * @class exports.Expression
 * @constructor
 * @extends exports.JSElement
 */
exports.Expression = function() {

    this.inherits(exports.JSElement);
    this.elementType = "Expression";
};
davinci.Inherits(exports.Expression, exports.JSElement);

exports.Expression.prototype.getText = function() {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }

    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    return s;

};
exports.Expression.prototype.add = function(e) {
};

// dojo.declare("exports.Expression", exports.JSElement, {
// elementType : "Expression",
//	
// getText : function () {},
// add : function(e){}
//	
// });
//

/**
 * @class exports.Function
 * @extends exports.Expression
 * @constructor
 */
exports.Function = function() {

    this.inherits(exports.Expression);
    this.elementType = "Function";
    this.name = null;
    this.parms = [];
    this.namePosition = 0;

    this.nosemicolon = true;

};
davinci.Inherits(exports.Function, exports.Expression);
exports.Function.prototype.add = function(e) {
    this.addChild(e);
};

exports.Function.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += "function ";
    if (this.name != null)
        s = s + this.name + " ";
    s = s + "(";
    for ( var i = 0; i < this.parms.length; i++ ) {
        if (i > 0)
            s = s + ",";
        s = s + this.parms[i].getText(context);
    }
    s = s + ")";
    s = s + this.printNewLine(context);
    context.indent += 2;
    s = s + '{';
    for ( var i = 0; i < this.children.length; i++ ) {
        s = s + this.printStatement(context, this.children[i]);
    }
    context.indent -= 2;
    s = s + this.printNewLine(context);
    s = s + "}";
    return s;
};

exports.Function.prototype.getLabel = function() {
    var s = "function ";
    if (this.name != null)
        s = s + this.name + " ";
    s = s + "(";
    var context = {};
    for ( var i = 0; i < this.parms.length; i++ ) {
        if (i > 0)
            s = s + ",";
        s = s + this.parms[i].getText(context);
    }
    s = s + ")";
    return s;
};

exports.Function.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    /* visit params before statements */

    if (!dontVisitChildren) {
        /* visit params like children ?? */
        /*
         * for (var i=0;i<this.parms.length; i++) this.parms[i].visit(visitor);
         */

        for ( var i = 0; i < this.children.length; i++ )
            this.children[i].visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);

};

/**
 * @class exports.NameReference
 * @extends exports.Expression
 * @constructor
 */
exports.NameReference = function() {

    this.inherits(exports.Expression);
    this.elementType = "NameReference";
    this.name = "";
};
davinci.Inherits(exports.NameReference, exports.Expression);

exports.NameReference.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    return s + this.name;
};

exports.NameReference.prototype.visit = function(visitor) {
    visitor.visit(this);
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.FieldReference
 * @extends exports.Expression
 * @constructor
 */
exports.FieldReference = function() {

    this.inherits(exports.Expression);
    this.elementType = "FieldReference";
    this.name = "";
    this.receiver = null;
};
davinci.Inherits(exports.FieldReference, exports.Expression);

exports.FieldReference.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    return s + this.receiver.getText(context) + "." + this.name;
};

exports.FieldReference.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren)
        this.receiver.visit(visitor);

    if (visitor.endVisit)
        visitor.endVisit(this);
};

// dojo.declare("exports.FieldReference", exports.Expression, {
// elementType : "FieldReference",
// name : "",
// receiver : null,
//	
// getText : function () {}
//	
// });

/**
 * @class exports.FunctionCall
 * @extends exports.Expression
 * @constructor
 */
exports.FunctionCall = function() {

    this.inherits(exports.Expression);
    this.elementType = "FunctionCall";
    this.receiver = null;
    this.parms = [];
};
davinci.Inherits(exports.FunctionCall, exports.Expression);

exports.FunctionCall.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += this.receiver.getText(context) + "(";
    for ( var i = 0; i < this.parms.length; i++ ) {
        if (i > 0)
            s = s + ", ";
        s = s + this.parms[i].getText(context);
    }
    s = s + ")";
    return s;
};

exports.FunctionCall.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren)
        for ( var i = 0; i < this.parms.length; i++ )
            this.parms[i].visit(visitor);
    if (visitor.endVisit)
        visitor.endVisit(this);
};

// dojo.declare("exports.FunctionCall", exports.Expression, {
// elementType : "FunctionCall",
// parms : [],
// receiver : null,
//
// constructor : function ()
// {
// this.parms=[];
// },
//	
// getText : function () {}
//	
// });

/**
 * @class exports.BinaryOperation
 * @extends exports.Expression
 * @constructor
 */
exports.BinaryOperation = function() {

    this.inherits(exports.Expression);
    this.elementType = "BinaryOperation";
    this.left = null;
    this.right = null;
    this.operator = 0;

};
davinci.Inherits(exports.BinaryOperation, exports.Expression);
exports.BinaryOperation.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    return s + this.left.getText(context) + this.operator
            + this.right.getText(context);
};

exports.BinaryOperation.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.left.visit(visitor);
        this.right.visit(visitor);
    }

    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.Literal
 * @extends exports.Expression
 * @constructor
 */
exports.Literal = function(type) {

    this.inherits(exports.Expression);
    this.elementType = "Literal";
    this.value = null;
    this.type = type;
};

davinci.Inherits(exports.Literal, exports.Expression);
exports.Literal.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    switch (this.type) {
    case "char":
        return s + "'" + this.value + "'";
    case "string":
        return s + '"' + this.value + '"';
    case "null":
    case "this":
    case "undefined":
    case "true":
    case "false":
        return s + this.type;
    }
    return s + this.value;
};

// dojo.declare("exports.Literal", exports.Expression, {
// elementType : "Literal",
// value : null,
// type : null,
//
// getText : function () {}
//	
// });
//
//

/**
 * @class exports.ParenExpression
 * @extends exports.Expression
 * @constructor
 */
exports.ParenExpression = function() {

    this.inherits(exports.Expression);
    this.elementType = "ParenExpression";
    this.expression = null;
};

davinci.Inherits(exports.ParenExpression, exports.Expression);
exports.ParenExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "(" + this.expression.getText(context) + ")";
    return s;
};

exports.ParenExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expression.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.AllocationExpression
 * @extends exports.Expression
 * @constructor
 */
exports.AllocationExpression = function() {

    this.inherits(exports.Expression);
    this.elementType = "AllocationExpression";
    this.expression = null;
    this.arguments = null;
};

davinci.Inherits(exports.AllocationExpression, exports.Expression);
exports.AllocationExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += "new " + this.expression.getText(context);
    if (this.arguments != null) {
        s = s + "(";
        for ( var i = 0; i < this.arguments.length; i++ ) {
            if (i > 0)
                s = s + ", ";
            s = s + this.arguments[i].getText(context);
        }
        s = s + ")";
    }
    return s;
};

exports.AllocationExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expression.visit(visitor);
    }

    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.FunctionExpression
 * @extends exports.Expression
 * @constructor
 */
exports.FunctionExpression = function() {

    this.inherits(exports.Expression);
    this.elementType = "FunctionExpression";
    this.func = null;
};

davinci.Inherits(exports.FunctionExpression, exports.Expression);
exports.FunctionExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.func.getText(context);
    return s;
};

exports.FunctionExpression.prototype.getLabel = function() {
    return this.func.getLabel();
};

exports.AllocationExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);

    if (!dontVisitChildren) {
        if (this.func) {
            debugger;
            this.func.visit(visitor);
        } else if (this.expression) {
            this.expression.visit(visitor);
        }

    }

    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.UnaryExpression
 * @extends exports.Expression
 * @constructor
 */
exports.UnaryExpression = function() {

    this.inherits(exports.Expression);
    this.elementType = "UnaryExpression";
    this.operator = null;
    this.expr = null;
};

davinci.Inherits(exports.UnaryExpression, exports.Expression);
exports.UnaryExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.operator + " " + this.expr.getText(context);
    return s;
};

exports.UnaryExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expr.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ObjectLiteral
 * @extends exports.Expression
 * @constructor
 */
exports.ObjectLiteral = function() {

    this.inherits(exports.Expression);
    this.elementType = "ObjectLiteral";
};

davinci.Inherits(exports.ObjectLiteral, exports.Expression);
exports.ObjectLiteral.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += '{';
    context.indent += 2;
    for ( var i = 0; i < this.children.length; i++ ) {
        if (i > 0)
            s = s + ", ";
        s = s + this.printNewLine(context);
        s = s + this.children[i].getText(context);
    }
    context.indent -= 2;
    s = s + this.printNewLine(context);
    s = s + "}";
    return s;
};

exports.ObjectLiteral.prototype.getLabel = function() {
    return "{}";
};

exports.ObjectLiteral.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ObjectLiteralField
 * @extends exports.Expression
 * @constructor
 */
exports.ObjectLiteralField = function() {

    this.inherits(exports.Expression);
    this.elementType = "ObjectLiteralField";
    this.name = "";
    this.nameType = "";
    this.initializer = null;
};

davinci.Inherits(exports.ObjectLiteralField, exports.Expression);
exports.ObjectLiteralField.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    if (this.nameType == '(string)')
        s = "'" + this.name + "'";
    else
        s = this.name;
    s = s + " : " + this.initializer.getText(context);
    return s;
};

exports.ObjectLiteralField.prototype.getLabel = function() {
    var s;
    if (this.nameType == '(string)')
        s = "'" + this.name + "'";
    else
        s = this.name;
    s = s + " : " + this.initializer.getLabel();
    return s;
};

exports.ObjectLiteralField.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.initializer.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ArrayAccess
 * @extends exports.Expression
 * @constructor
 */
exports.ArrayAccess = function() {
    this.inherits(exports.Expression);
    this.elementType = "ArrayAccess";
    this.array = null;
    this.index = null;
};

davinci.Inherits(exports.ArrayAccess, exports.Expression);
exports.ArrayAccess.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += this.array.getText(context) + "[" + this.index.getText(context) + "]";
    return s;
};

exports.ArrayAccess.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.array.visit(visitor);
        this.index.visit(visitor);
    }

    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ArrayInitializer
 * @extends exports.Expression
 * @constructor
 */
exports.ArrayInitializer = function() {
    this.inherits(exports.Expression);
    this.elementType = "ArrayInitializer";
};

davinci.Inherits(exports.ArrayInitializer, exports.Expression);
exports.ArrayInitializer.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "[";
    for ( var i = 0; i < this.children.length; i++ ) {
        if (i > 0)
            s = s + ", ";
        s = s + this.children[i].getText(context);
    }
    s = s + "]";
    return s;
};

exports.ArrayInitializer.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.PrefixPostfixExpression
 * @extends exports.Expression
 * @constructor
 */
exports.PrefixPostfixExpression = function() {
    this.inherits(exports.Expression);
    this.isPrefix = false;
    this.expr = null;
    this.operator = null;
    this.elementType = "PrefixPostfixExpression";
};

davinci.Inherits(exports.PrefixPostfixExpression, exports.Expression);
exports.PrefixPostfixExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    if (this.isPrefix)
        s = s + this.operator;
    s = s + this.expr.getText(context);
    if (!this.isPrefix)
        s = s + this.operator;
    return s;
};

exports.PrefixPostfixExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expr.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ConditionalExpression
 * @extends exports.Expression
 * @constructor
 */
exports.ConditionalExpression = function() {
    this.inherits(exports.Expression);
    this.condition = null;
    this.trueValue = null;
    this.falseValue = null;
    this.elementType = "ConditionalExpression";
};

davinci.Inherits(exports.ConditionalExpression, exports.Expression);
exports.ConditionalExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.condition.getText(context) + " ? "
            + this.trueValue.getText(context) + " : "
            + this.falseValue.getText(context);
    return s;
};

exports.ConditionalExpression.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.condition.visit(visitor);
        this.trueValue.visit(visitor);
        this.falseValue.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.Label
 * @extends exports.JSElement
 * @constructor
 */
exports.Label = function(name) {
    this.inherits(exports.JSElement);
    this.elementType = "Label";
    this.nosemicolon = true;
    this.s = name;
};

davinci.Inherits(exports.Label, exports.JSElement);

exports.Label.prototype.getText = function(context) {

    return this.s + " : ";
};

/**
 * @class exports.UnparsedRegion
 * @extends exports.JSElement
 * @constructor
 */
exports.UnparsedRegion = function(content) {
    this.inherits(exports.JSElement);
    this.elementType = "UnparsedRegion";
    this.s = content;
};

davinci.Inherits(exports.UnparsedRegion, exports.JSElement);

exports.UnparsedRegion.prototype.getText = function(context) {

    return this.s;
};

/**
 * @class exports.Comment
 * @extends exports.JSElement
 * @constructor
 */
exports.Comment = function() {
    this.inherits(exports.JSElement);
    this.elementType = "Comment";
    this.nosemicolon = true;
};

davinci.Inherits(exports.Comment, exports.JSElement);
exports.Comment.prototype.addComment = function(type, startLne, startOffst,
        stopLne, stopOffst, text) {

    if (this.comments == null) {
        this.comments = [];

    }

    this.comments[this.comments.length] = {
        commentType : type,
        startLine : startLne,
        startOffset : startOffst,
        stopLine : stopLne,
        stopOffset : stopOffst,
        s : text
    };

};

exports.Comment.prototype.getText = function(context) {
    var s = "";

    for ( var i = 0; i < this.comments.length; i++ ) {
        if (this.comments[i].commentType == "line") {
            s += "//" + this.comments[i].s + "\n";
        } else if (this.comments[i].commentType == "block") {
            s += "/*" + this.comments[i].s + "*/\n";
        }
    }
    return s;
};

/**
 * @class exports.EmptyExpression
 * @extends exports.Expression
 * @constructor
 */
exports.EmptyExpression = function() {
    this.inherits(exports.Expression);
    this.elementType = "EmptyExpression";
};

davinci.Inherits(exports.EmptyExpression, exports.Expression);
exports.EmptyExpression.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    return s + "";
};

/**
 * @class exports.VariableDeclaration
 * @extends exports.JSElement
 * @constructor
 */
exports.VariableDeclaration = function() {

    this.inherits(exports.JSElement);

    this.elementType = "VariableDeclaration";
    this.value = null;
    this.type = null;
};
davinci.Inherits(exports.VariableDeclaration, exports.JSElement);
exports.VariableDeclaration.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "var ";
    for ( var i = 0; i < this.children.length; i++ ) {
        if (i > 0)
            s = s + ", ";
        s = s + this.children[i].getText(context);
    }
    return s;
};

exports.VariableDeclaration.prototype.visit = function(visitor) {
    var dontVisitChildren;
    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

// dojo.declare("exports.VariableDeclaration", exports.JSElement, {
// elementType : "VariableDeclaration",
//	
// getText : function () {}
//	
// });
//

/**
 * @class exports.VariableFragment
 * @extends exports.JSElement
 * @constructor
 */
exports.VariableFragment = function() {

    this.inherits(exports.JSElement);
    this.elementType = "VariableFragment";
    this.name = "";
    this.init = null;
};
davinci.Inherits(exports.VariableFragment, exports.JSElement);
exports.VariableFragment.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.name;
    if (this.init != null) {
        s = s + " = " + this.init.getText(context);
    }
    return s;
};
exports.VariableFragment.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        if (this.init)
            this.init.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.Block
 * @extends exports.JSElement
 * @constructor
 */
exports.Block = function() {
    this.inherits(exports.JSElement);
    this.nosemicolon = true;
    this.elementType = "Block";
    this.nosemicolon = true;
};
davinci.Inherits(exports.Block, exports.JSElement);

exports.Block.prototype.getText = function(context) {
    context.indent += 2;
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += '{';
    for ( var i = 0; i < this.children.length; i++ ) {
        s = s + this.printNewLine(context);
        s = s + this.children[i].getText(context)
                + (this.children[i].nosemicolon ? "" : ";");
    }
    context.indent -= 2;
    s = s + this.printNewLine(context);
    s = s + "}";
    return s;
};

exports.Block.prototype.getLabel = function() {

    return "{     }";
};

exports.Block.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};
/**
 * @class exports.If
 * @extends exports.JSElement
 * @constructor
 */
exports.If = function() {
    this.inherits(exports.JSElement);
    this.elementType = "If";
    this.expr = null;
    this.trueStmt = null;
    this.elseStmt = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.If, exports.JSElement);

exports.If.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "if (" + this.expr.getText(context) + ")";
    context.indent += 2;
    s = s + this.printStatement(context, this.trueStmt);
    if (this.elseStmt != null) {
        context.indent -= 2;
        s = s + this.printNewLine(context) + "else";
        context.indent += 2;
        s = s + this.printStatement(context, this.elseStmt);
    }
    context.indent -= 2;
    return s;
};
exports.If.prototype.getLabel = function() {

    return "if (" + this.expr.getLabel() + ")";
    ;
};

exports.If.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expr.visit(visitor);
        if (this.trueStmt)
            this.trueStmt.visit(visitor);
        if (this.elseStmt)
            this.elseStmt.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.Try
 * @extends exports.JSElement
 * @constructor
 */
exports.Try = function() {
    this.inherits(exports.JSElement);
    this.elementType = "Try";
    this.stmt = null;
    this.catchBlock = null;
    this.finallyBlock = null;
    this.catchArgument = null;
};
davinci.Inherits(exports.Try, exports.JSElement);

exports.Try.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }

    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += "try";
    s = s + this.printNewLine(context) + this.stmt.getText(context);
    if (this.catchBlock) {
        s = s + this.printNewLine(context) + "catch (" + this.catchArgument
                + ")";
        s = s + this.printStatement(context, this.catchBlock);
    }
    if (this.finallyBlock) {
        s = s + this.printNewLine(context) + "finally";
        s = s + this.printStatement(context, this.finallyBlock);
    }
    return s;
};

exports.Try.prototype.getLabel = function() {

    return "try";
};

exports.Try.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.stmt.visit(visitor);
        if (this.catchBlock)
            this.catchBlock.visit(visitor);
        if (this.finallyBlock)
            this.finallyBlock.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.For
 * @extends exports.JSElement
 * @constructor
 */
exports.For = function() {
    this.inherits(exports.JSElement);
    this.elementType = "For";
    this.initializations = null;
    this.condition = null;
    this.increments = null;
    this.action = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.For, exports.JSElement);

exports.For.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }

    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }

    s += "for (";
    if (this.initializations != null)
        for ( var i = 0; i < this.initializations.length; i++ ) {
            if (i > 0)
                s = s + ", ";
            s = s + this.initializations[i].getText(context);
        }
    s = s + ";";
    if (this.condition != null)
        s = s + this.condition.getText(context);
    s = s + ";";

    if (this.increments != null)
        for ( var i = 0; i < this.increments.length; i++ ) {
            if (i > 0)
                s = s + ", ";
            s = s + this.increments[i].getText(context);
        }
    context.indent += 2;
    s = s + ")" + this.printStatement(context, this.action);
    context.indent -= 2;
    return s;
};

exports.For.prototype.getLabel = function() {

    return "for";
};

exports.For.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        if (this.initializations)
            for ( var i = 0; i < this.initializations.length; i++ ) {
                this.initializations[i].visit(visitor);
            }
        if (this.condition)
            this.condition.visit(visitor);
        if (this.increments)
            for ( var i = 0; i < this.increments.length; i++ ) {
                this.increments[i].visit(visitor);
            }
        this.action.visit(visitor);
    }

    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.ForIn
 * @extends exports.JSElement
 * @constructor
 */
exports.ForIn = function() {
    this.inherits(exports.JSElement);
    this.elementType = "ForIn";
    this.iterationVar = null;
    this.collection = null;
    this.action = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.ForIn, exports.JSElement);

exports.ForIn.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "for ( " + this.iterationVar.getText(context) + " in "
            + this.collection.getText(context) + ")";
    context.indent += 2;
    s = s + this.printStatement(context, this.action);
    context.indent -= 2;
    return s;
};

exports.ForIn.prototype.getLabel = function() {

    return "for ( " + this.iterationVar.getLabel() + " in "
            + this.collection.getLabel() + ")";
};

exports.ForIn.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.action.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.With
 * @extends exports.JSElement
 * @constructor
 */
exports.With = function() {
    this.inherits(exports.JSElement);
    this.elementType = "With";
    this.expr = null;
    this.action = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.With, exports.JSElement);

exports.With.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "with ( " + this.expr.getText(context) + " )";
    context.indent += 2;
    s = s + this.printStatement(context, this.action);
    context.indent -= 2;
    return s;
};

exports.With.prototype.getLabel = function() {

    return "with ( " + this.expr.getText(context) + " )";
};
exports.With.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.action.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};
/**
 * @class exports.While
 * @extends exports.JSElement
 * @constructor
 */
exports.While = function() {
    this.inherits(exports.JSElement);
    this.elementType = "While";
    this.expr = null;
    this.action = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.While, exports.JSElement);

exports.While.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "while ( " + this.expr.getText(context) + " )";
    context.indent += 2;
    s = s + this.printStatement(context, this.action);
    context.indent -= 2;
    return s;
};

exports.While.prototype.getLabel = function() {

    return "while ( " + this.expr.getLabel() + " )";
};

exports.While.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expr.visit(visitor);
        this.action.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};
/**
 * @class exports.Debugger
 * @extends exports.JSElement
 * @constructor
 */
exports.Debugger = function(statement) {
    this.inherits(exports.JSElement);
    this.elementType = "Debugger";
};
davinci.Inherits(exports.Debugger, exports.JSElement);

exports.Debugger.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    return s + "debugger";
};

/**
 * @class exports.Branch
 * @extends exports.JSElement
 * @constructor "continue" or "break"
 */
exports.Branch = function(statement) {
    this.inherits(exports.JSElement);
    this.elementType = "Branch";
    this.statement = statement;
    this.targetLabel = null;
};
davinci.Inherits(exports.Branch, exports.JSElement);

exports.Branch.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.statement;
    if (this.targetLabel)
        s = s + " " + this.targetLabel;
    return s;
};

exports.Branch.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (visitor.endVisit)
        visitor.endVisit(this);
};
/**
 * @class exports.Exit
 * @extends exports.JSElement
 * @constructor "return" or "throw"
 */
exports.Exit = function(statement) {
    this.inherits(exports.JSElement);
    this.elementType = "Exit";
    this.statement = statement;
    this.expr = null;
};
davinci.Inherits(exports.Exit, exports.JSElement);

exports.Exit.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += this.statement;
    if (this.expr)
        s = s + " " + this.expr.getText(context);
    return s;
};

/**
 * @class exports.Do
 * @extends exports.JSElement
 * @constructor
 */
exports.Do = function() {
    this.inherits(exports.JSElement);
    this.elementType = "Do";
    this.expr = null;
    this.action = null;
};
davinci.Inherits(exports.Do, exports.JSElement);

exports.Do.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "do";
    context.indent += 2;
    s = s + this.printStatement(context, this.action);
    context.indent -= 2;
    var s = s + this.printNewLine(context) + "while ( "
            + this.expr.getText(context) + " )";
    return s;

};

exports.Do.prototype.getLabel = function() {

    return "do while";
};

exports.Do.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (!dontVisitChildren) {
        this.expr.visit(visitor);
        this.action.visit(visitor);
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};
/**
 * @class exports.Switch
 * @extends exports.JSElement
 * @constructor
 */
exports.Switch = function() {
    this.inherits(exports.JSElement);
    this.elementType = "Switch";
    this.expr = null;
    this.nosemicolon = true;
};
davinci.Inherits(exports.Switch, exports.JSElement);

exports.Switch.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    s += "switch (" + this.expr.getText(context) + " )";
    s = s + this.printNewLine(context) + "{";
    context.indent += 2;
    for ( var i = 0; i < this.children.length; i++ ) {
        s = s + this.printStatement(context, this.children[i]);
    }
    context.indent -= 2;
    s = s + this.printNewLine(context) + "}";
    return s;

};

exports.Switch.prototype.getLabel = function() {

    return "switch (" + this.expr.getLabel() + " )";
};

exports.Switch.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);

    if (!dontVisitChildren) {
        this.expr.visit(visitor);
        for ( var i = 0; i < this.children.length; i++ ) {
            this.children[i].visit(visitor);
        }
    }
    if (visitor.endVisit)
        visitor.endVisit(this);
};

/**
 * @class exports.Case
 * @extends exports.JSElement
 * @constructor
 */
exports.Case = function() {
    this.inherits(exports.JSElement);
    this.elementType = "Case";
    this.expr = null;
};
davinci.Inherits(exports.Case, exports.JSElement);

exports.Case.prototype.getText = function(context) {
    var s = "";
    if (this.comment) {
        s += this.printNewLine(context) + this.comment.getText(context);
    }
    if (this.label) {
        s += this.printNewLine(context) + this.label.getText(context);
    }
    if (this.expr)
        s += "case " + this.expr.getText(context);
    else
        s += "default";
    s = s + " : ";
    return s;

};

exports.Case.prototype.visit = function(visitor) {
    var dontVisitChildren;

    dontVisitChildren = visitor.visit(this);
    if (visitor.endVisit)
        visitor.endVisit(this);
};
});

//exports.JSElement.parse =davinci.model.parser.parse;
