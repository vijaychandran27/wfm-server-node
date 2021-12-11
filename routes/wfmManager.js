var express=require("express")
var route = express.Router();
var model = require('../orm/model')
const jwt=require("jsonwebtoken");
const { QueryTypes } = require('sequelize');
var sequelize=require('../orm/connection');

route.get("/getEmployees",async function(request,response){
   try{
      const employees = await sequelize.query(
         `SELECT wfm.softlock.employee_id, wfm.softlock.manager as request, wfm.softlock.reqdate,
         wfm.employees.manager FROM wfm.softlock LEFT JOIN wfm.employees ON wfm.employees.employee_id = wfm.softlock.employee_id
         WHERE wfm.employees.wfm_manager = $manager AND wfm.softlock.status = 'waiting';`,
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

route.post("/updateRequestMessage", async function (request, resonse) {
   try {
      const employee_id = request.body.employee_id;
      const managerstatus = request.body.managerstatus;
      const mgrstatuscomment = request.body.mgrstatuscomment;

      const result =await sequelize.query(`UPDATE wfm.softlock SET managerstatus = $managerstatus, mgrstatuscomment = $mgrstatuscomment, wfm.softlock.status = 'approved', mgrlastupdate = CURDATE() 
         WHERE employee_id = $employee_id;`,
         {
            bind: { employee_id:employee_id, managerstatus:managerstatus, mgrstatuscomment:mgrstatuscomment },
            type: QueryTypes.UPDATE
         }
      ).then(async res => {

         let locakstatus = 'not_requested'
         if(managerstatus == 'accepted')
            locakstatus = 'locked'
         let employeeRes = await sequelize.query(`UPDATE wfm.employees
         SET lockstatus = $locakstatus
         WHERE employee_id = $employee_id;`,
         {
            bind: { employee_id:employee_id, locakstatus:locakstatus },
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