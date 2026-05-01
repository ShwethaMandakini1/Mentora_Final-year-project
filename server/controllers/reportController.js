const Submission = require('../models/Submission');

// GET all graded reports
exports.getAllReports = async (req, res) => {
  try {
    const reports = await Submission.find({status:'Graded'})
      .populate('student','username email studentId batchYear degree')
      .sort({gradedAt:-1});
    res.json({success:true, reports});
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};

// GET single submission report
exports.getSubmissionReport = async (req, res) => {
  try {
    const sub = await Submission.findById(req.params.id)
      .populate('student','username email studentId batchYear degree');
    if(!sub) return res.status(404).json({success:false,message:'Not found'});
    res.json({success:true, report:sub});
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};

// GET student's own reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Submission.find({student:req.user._id, status:'Graded'})
      .sort({gradedAt:-1});
    res.json({success:true, reports});
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};

// GET class summary
exports.getClassSummary = async (req, res) => {
  try {
    const graded = await Submission.find({status:'Graded'})
      .populate('student','username email studentId');

    const byModule = {};
    const byStudent = {};

    graded.forEach(s=>{
      if(s.moduleName){
        if(!byModule[s.moduleName]) byModule[s.moduleName]={total:0,sumScore:0};
        byModule[s.moduleName].total++;
        byModule[s.moduleName].sumScore+=(s.score||0);
      }
      const sid=s.student?._id?.toString();
      if(sid){
        if(!byStudent[sid]) byStudent[sid]={username:s.student?.username,total:0,sumScore:0,submissions:[]};
        byStudent[sid].total++;
        byStudent[sid].sumScore+=(s.score||0);
        byStudent[sid].submissions.push({assignment:s.assignmentName,score:s.score,grade:s.grade});
      }
    });

    Object.keys(byModule).forEach(m=>{ byModule[m].average=Math.round(byModule[m].sumScore/byModule[m].total); });
    Object.keys(byStudent).forEach(s=>{ byStudent[s].average=Math.round(byStudent[s].sumScore/byStudent[s].total); });

    res.json({success:true, summary:{totalGraded:graded.length,byModule,byStudent}});
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};