declare namespace Build {
    type JsDocAstNode = {
        comment?: string;
        name?: string;
        longname?: string;
        description?: string;
        memberof?: string;
        type?: JsDocAstType;
        kind?: 'function' | 'member' | 'package' | 'constant';

        params?: JsDocAstParam[];
        returns?: JsDocAstReturn[];
    };

    type JsDocAstParam = {
        type?: JsDocAstType;
        name: string;
        description?: string;
    };

    type JsDocAstReturn = Omit<JsDocAstParam, "name">;

    type JsDocAstType = {
        names: string[];
    }

    type JsDocAstTyped = JsDocAstNode | JsDocAstParam | JsDocAstReturn;
}
