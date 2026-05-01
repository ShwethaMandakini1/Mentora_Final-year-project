const Submission = require('../models/Submission');

// GET grade analytics
exports.getGradeAnalytics = async (req, res) => {
  try {
    const all     = await Submission.find().populate('student','username email studentId');
    const graded  = all.filter(s=>s.status==='Graded');
    const pending = all.filter(s=>s.status==='Pending').length;

    const avgScore = graded.length>0
      ? Math.round(graded.reduce((a,s)=>a+(s.score||0),0)/graded.length) : 0;

    const distribution = {
      'A+': graded.filter(s=>s.score>=90).length,
      'A':  graded.filter(s=>s.score>=85&&s.score<90).length,
      'A-': graded.filter(s=>s.score>=80&&s.score<85).length,
      'B+': graded.filter(s=>s.score>=75&&s.score<80).length,
      'B':  graded.filter(s=>s.score>=70&&s.score<75).length,
      'B-': graded.filter(s=>s.score>=65&&s.score<70).length,
      'C+': graded.filter(s=>s.score>=60&&s.score<65).length,
      'C':  graded.filter(s=>s.score>=55&&s.score<60).length,
      'F':  graded.filter(s=>s.score<55).length,
    };

    const modules = [...new Set(graded.map(s=>s.moduleName).filter(Boolean))];
    const moduleStats = modules.map(mod=>{
      const ms=graded.filter(s=>s.moduleName===mod);
      return { name:mod, avg:Math.round(ms.reduce((a,s)=>a+(s.score||0),0)/ms.length), count:ms.length };
    });

    const atRisk = graded.filter(s=>s.score<65).map(s=>({
      student:s.student, module:s.moduleName, score:s.score, assignment:s.assignmentName,
    }));

    res.json({
      success:true,
      analytics:{
        total:all.length, pending, graded:graded.length, avgScore,
        highest:graded.length>0?Math.max(...graded.map(s=>s.score||0)):0,
        lowest: graded.length>0?Math.min(...graded.map(s=>s.score||0)):0,
        passRate:graded.length>0?Math.round((graded.filter(s=>s.score>=55).length/graded.length)*100):0,
        distribution, moduleStats, atRisk,
      }
    });
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};

// GET all graded submissions
exports.getGradedSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({status:'Graded'})
      .populate('student','username email studentId')
      .sort({gradedAt:-1});
    res.json({success:true, submissions});
  } catch(err){
    res.status(500).json({success:false,message:err.message});
  }
};