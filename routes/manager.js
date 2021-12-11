var express=require("express")
var route = express.Router();
var model = require('../orm/model')
const jwt=require("jsonwebtoken");
const { QueryTypes } = require('sequelize');
var sequelize=require('../orm/connection');

route.get("/getEmployees",async function(request,response){
   try{
      const employees = await sequelize.query(
         `SELECT skillmap.employee_id,employees.name,employees.status,employees.manager,
         employees.wfm_manager,employees.email,employees.lockstatus,
         employees.experience,(select name from profile where profile_id=employees.profile_id) as profile,GROUP_CONCAT(skills.name) AS skillSet FROM skillmap  
         LEFT JOIN skills ON skillmap.skillid = skills.skillid join employees on employees.employee_id=skillmap.employee_id 
         where employees.manager=$manager and employees.lockstatus='not_requested'
         GROUP BY skillmap.employee_id ORDER BY skillmap.employee_id;`,
         {
            bind: { manager: request.query.managerName },
            type: QueryTypes.SELECT
         }
      );
      
      if(employees && employees.length > 0){
         response.json({
            statusCode:200,
            message:"Success",
            data:employees
         })
      }
      else
      response.json(
                  {
                     statusCode:404,
                     message:"Request Employees is Empty",
                     data:null
                  }
               )
   }
   catch(e)
   {
      console.log(e)
         response.status(500)
   }

});

route.post("/insertRequestMessage", async function (request, resonse) {
   try {
      const employee_id = request.body.employee_id;
      const manager = request.body.manager;
      const requestMessage = request.body.requestMessage;

      const result =await sequelize.query(`INSERT INTO softlock
         (employee_id,manager,reqdate,status,lastupdated,requestmessage,managerstatus) values
         ($employee_id,$manager,CURDATE(),'waiting',CURDATE(),$requestMessage,'awaiting_confirmation');`,
         {
            bind: { employee_id:employee_id,manager:manager,requestMessage:requestMessage },
            type: QueryTypes.INSERT
         }
      ).then(async res => {
         let employeeRes = await sequelize.query(`UPDATE wfm.employees
         SET lockstatus = 'request_waiting' 
         WHERE employee_id = $employee_id;`,
         {
            bind: { employee_id:employee_id },
            type: QueryTypes.UPDATE
         }).then(res =>{
            resonse.json({
               statusCode:200,
               message:"Success",
               data:res
            })
         }).catch(ex =>{
            resonse.json({
               statusCode:500,
               message:"Failure",
               data:ex
            })
         })
      })
      .catch(ex =>{
         resonse.json({
            statusCode:500,
            message:"Failure",
            data:ex
         })
      });
   
   }
   catch (e) {
      console.log(e)
      res.status(500)
   }

})

module.exports=  route