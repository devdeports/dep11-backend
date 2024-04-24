const json2sql = require("../utils/Json2Sql");
const SqlConnection = require("../utils/SqlConnection");


// models
const model = require("../models/services");


// list srv
exports.getServices = async (filters = {}) => {
    const srvApp = await getSrvBd(filters);

    if(srvApp.length > 0) {
        for(let i = 0; i < srvApp.length; i++){
            const srvTagApp = await getTagServiceBd(srvApp[i].IdService);
            srvApp[i].Category = srvTagApp;
        }
    }

    return {
        status: 200 ,
        success: true,
        message: "services listed",
        data: srvApp
    };
};

// srv details
exports.getServiceDetail = async (idService = 0) => {
    const srvApp = await getFullServiceDetail(idService);

console.log(srvApp);
// traer content segun id y agregar como name en contents
// organiza objeto de retorno

model.servicesContent;

    return { status: 200 , success: true, message: "message", data: [] };

    // return {
    //     status: 200 ,
    //     success: true,
    //     message: "services listed",
    //     data: srvApp
    // };
};







// list tags
exports.getTags = async (filters = {}) => {
    const tagApp = await getTagBd(filters);

    return {
        status: 200 ,
        success: true,
        message: "tags listed",
        data: tagApp
    };
};

// add tag
exports.addTag = async (data) => {
    delete data.userId;
    const newTag = { ...model.categories, ...data };
    const tagApp = await addTagBd(newTag);

    return {
        status: 200 ,
        success: true,
        message: "tag created",
        data: tagApp
    };
};

// del tag
exports.delTag = async (id = 0) => {
    const tagApp = await delTagBd(id);

    return {
        status: 200,
        success: true,
        message: "delete tag successfully.",
        data: tagApp
    };
};


// get tag filters
async function getTagBd(data){
    const columns = {
        "IdTag": true,
        "Tag": true,
        "Observation": true
    };

    let conditions = { isActive: true };

    if(data["idTag"] != undefined){
        conditions.idTag = data["idTag"];
    }

    const sort = {"Tag": true};

    const query = json2sql.createSelectQuery("SrvCategories", undefined, columns, conditions, sort, undefined, undefined);

    try {
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;
    } catch (error) {
        console.log("Error al selecionar el registro.");
        console.error(error);
    }
};

// insert new tag
async function addTagBd(data){
    try {
        const query = json2sql.createInsertQuery("SrvCategories", data);
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;

    } catch (error) {
        throw error;
    }
};

// delete tag
async function delTagBd(id = 0){
    const conditions = { idTag: id };
    try {
        const query = json2sql.createDeleteQuery("SrvCategories", conditions);
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;

    } catch (error) {
        throw error;
    }
};






// get services filters
async function getSrvBd(data){
    const columns = { "*": true };

    let conditions = {
        isActive: true,
        isDeleted: false,
        idRegion: {
            $in: data.IdRegion
        }
    };

    if(data.IdService != undefined){
        conditions.idService = data.IdService;
        delete conditions.isActive;
        delete conditions.isDeleted;
    }

    const sort = {"idService": true};
    const query = json2sql.createSelectQuery("SrvServices", undefined, columns, conditions, sort, undefined, undefined);

    try {
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;
    } catch (error) {
        console.log("Error al selecionar el registro.");
        console.error(error);
    }
};


async function getTagServiceBd(idService){
    const columns = {
        "S.*": true,
        "C.Tag": true,
        "C.Observation": true
    };

    const conditions = {
        "S.IdService": idService,
        "S.IsActive": 1,
        "(C.IsActive = 1 AND C.IsDeleted = 0)": undefined
    };

    const join = {
        "C" : {
            $innerJoin: {
                $table: "SrvCategories",
                $on: { 'S.IdTag': { $eq: '~~C.IdTag' } }
            }
        }
    };

    const query = json2sql.createSelectQuery("SrvServicesCategory", join, columns, conditions, undefined, undefined, undefined);
    query.sql = query.sql.replace("`SrvServicesCategory`", "`SrvServicesCategory` AS `S`");
    query.sql = query.sql.replace(/`/g, '');
    query.sql = query.sql.replace(/  /g, ' ');

    try {
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;
    } catch (error) {
        console.log("Error al selecionar el registro.");
        console.error(error);
    }
};


async function getFullServiceDetail(idService){
    const columns = {
        "S.*": true,
        "T.IdTag": true,
        "T.Tag": true,
        "T.Observation": true,
        "C.Id": "IdSegment",
        "C.Description": true,
        "C.Order": true,
        "C.IdCourse": true,
        "C.IdProduct": true,
        "C.IdContent": true,
        "C.IsActive": "CIsActive",
        "C.IsDeleted": "CIsDeleted"
    };

    const conditions = {
        "S.IdService": idService,
        "S.IsActive": 1,
        "C.IsDeleted": 0,
        "(T.IsActive = 1 AND T.IsDeleted = 0)": undefined,
    };

    const join = {
        "T" : {
            $innerJoin: {
                $table: "SrvCategories",
                $on: { 'S.IdTag': { $eq: '~~T.IdTag' } }
            }
        },
        "C" : {
            $innerJoin: {
                $table: "SrvServicesContent",
                $on: { 'S.IdService': { $eq: '~~C.IdService' } }
            }
        },
    };

    const sort = {"C.Order": true };

    const query = json2sql.createSelectQuery("SrvServicesCategory", join, columns, conditions, sort, undefined, undefined);
    query.sql = query.sql.replace("`SrvServicesCategory`", "`SrvServicesCategory` AS `S`");
    query.sql = query.sql.replace(/`/g, '');
    query.sql = query.sql.replace(/  /g, ' ');

    try {
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;
    } catch (error) {
        console.log("Error al selecionar el registro.");
        console.error(error);
    }
};







// Edit user
exports.editUser = async (data) => {
    const conditions = { "id": data.id };
    delete data.id;
    delete data.userId;

    const userApp = await editUserApp(data, conditions);

    return {
        status: 200 ,
        success: true,
        message: "user edited",
        data: userApp
    };
};

// edit user
async function editUserApp(values, conditions){
    try {
        const query = json2sql.createUpdateQuery("Users", values, conditions);
        const queryResult = await SqlConnection.executeQuery(query.sql, query.values);
        return queryResult.results;

    } catch (error) {
        throw error;
    }
};


//return { status: 200 , success: true, message: "message", data: [] };