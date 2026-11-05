import {
  rrbNtpcPolicy,
  rrbLegacy25_30Policy,
  rrb40_35Policy,
  evaluateRrbTyping
} from './rrbTyping.utility.js';

import {
  highCourtGenericWpmPolicy,
  highCourtMarksPerMistakePolicy,
  highCourtMultiLanguagePolicy,
  evaluateHighCourtTyping
} from './highCourtTyping.utility.js';

export const EXAM_EVALUATOR_REGISTRY = Object.freeze({
  RRB_NTPC_CBTST: {
    family: 'RRB',
    createPolicy: rrbNtpcPolicy,
    evaluate: evaluateRrbTyping
  },
  RRB_LEGACY_25_30: {
    family: 'RRB',
    createPolicy: rrbLegacy25_30Policy,
    evaluate: evaluateRrbTyping
  },
  RRB_40_35_NO_IGNORABLE: {
    family: 'RRB',
    createPolicy: rrb40_35Policy,
    evaluate: evaluateRrbTyping
  },
  HIGH_COURT_GENERIC_WPM: {
    family: 'HIGH_COURT',
    createPolicy: highCourtGenericWpmPolicy,
    evaluate: evaluateHighCourtTyping
  },
  HIGH_COURT_MARKS_PER_MISTAKE: {
    family: 'HIGH_COURT',
    createPolicy: highCourtMarksPerMistakePolicy,
    evaluate: evaluateHighCourtTyping
  },
  HIGH_COURT_MULTI_LANGUAGE: {
    family: 'HIGH_COURT',
    createPolicy: highCourtMultiLanguagePolicy,
    evaluate: evaluateHighCourtTyping
  }
});
