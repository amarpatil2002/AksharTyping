import mongoose from 'mongoose';
const { Schema, model, models } = mongoose;
const nonNegative={type:Number,min:0,default:0};
const schema = new Schema({
  attemptId:{type:Schema.Types.ObjectId,ref:'TypingAttempt',required:true,unique:true,index:true},
  duration:{seconds:{...nonNegative},minutes:{...nonNegative}},
  words:{expected:{...nonNegative},typed:{...nonNegative},correct:{...nonNegative},incorrect:{...nonNegative}},
  characters:{expected:{...nonNegative},typed:{...nonNegative},correct:{...nonNegative},incorrect:{...nonNegative}},
  graphemes:{expected:{...nonNegative},typed:{...nonNegative},correct:{...nonNegative}},
  errors:{total:{...nonNegative},wordErrors:{...nonNegative},characterErrors:{...nonNegative},insertions:{...nonNegative},deletions:{...nonNegative},substitutions:{...nonNegative},spacingErrors:{...nonNegative},punctuationErrors:{...nonNegative}},
  speed:{grossWpm:{...nonNegative},grossCpm:{...nonNegative},kdph:{...nonNegative}},
  accuracy:{word:{type:Number,min:0,max:100,default:0},character:{type:Number,min:0,max:100,default:0}},
  errorPercentage:{type:Number,min:0,max:100,default:0},
  engineVersion:{type:String,required:true,default:'1.0.0'}
},{timestamps:true,versionKey:false});
export default models.TypingEvaluation || model('TypingEvaluation',schema);
