"""
Mental Health Assessor for Sakhi AI - Mental health screening and assessment
"""

import logging
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# Statistical analysis
try:
    import numpy as np
    from sklearn.preprocessing import MinMaxScaler
    HAS_SCIENTIFIC_STACK = True
except ImportError:
    HAS_SCIENTIFIC_STACK = False
    logging.warning("Scientific libraries not available. Install with: pip install numpy scikit-learn")

from ..utils.logger import get_logger

logger = get_logger(__name__)

class MentalHealthAssessor:
    """Mental health assessment and screening tool"""

    def __init__(self):
        """Initialize Mental Health Assessor"""
        self.assessment_templates = self._load_assessment_templates()
        self.scoring_weights = self._load_scoring_weights()

    def _load_assessment_templates(self) -> Dict[str, Dict[str, Any]]:
        """Load assessment question templates"""
        return {
            'depression_phq9': {
                'name': 'PHQ-9 Depression Screening',
                'description': 'Patient Health Questionnaire-9 for depression screening',
                'questions': [
                    {
                        'id': 'phq9_1',
                        'text': 'Little interest or pleasure in doing things',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_2',
                        'text': 'Feeling down, depressed, or hopeless',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_3',
                        'text': 'Trouble falling or staying asleep, or sleeping too much',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_4',
                        'text': 'Feeling tired or having little energy',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_5',
                        'text': 'Poor appetite or overeating',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_6',
                        'text': 'Feeling bad about yourself—or that you are a failure or have let yourself or your family down',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_7',
                        'text': 'Trouble concentrating on things, such as reading the newspaper or watching television',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_8',
                        'text': 'Moving or speaking so slowly that other people could have noticed. Or the opposite—being so fidgety or restless that you have been moving around a lot more than usual',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'phq9_9',
                        'text': 'Thoughts that you would be better off dead, or of hurting yourself in some way',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    }
                ],
                'scoring': {
                    'min_score': 0,
                    'max_score': 27,
                    'categories': {
                        'minimal': (0, 4),
                        'mild': (5, 9),
                        'moderate': (10, 14),
                        'moderately_severe': (15, 19),
                        'severe': (20, 27)
                    }
                }
            },
            'anxiety_gad7': {
                'name': 'GAD-7 Anxiety Screening',
                'description': 'Generalized Anxiety Disorder-7 for anxiety screening',
                'questions': [
                    {
                        'id': 'gad7_1',
                        'text': 'Feeling nervous, anxious, or on edge',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_2',
                        'text': 'Not being able to stop or control worrying',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_3',
                        'text': 'Worrying too much about different things',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_4',
                        'text': 'Trouble relaxing',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_5',
                        'text': 'Being so restless that it is hard to sit still',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_6',
                        'text': 'Becoming easily annoyed or irritable',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    },
                    {
                        'id': 'gad7_7',
                        'text': 'Feeling afraid, as if something awful might happen',
                        'options': [
                            {'value': 0, 'text': 'Not at all'},
                            {'value': 1, 'text': 'Several days'},
                            {'value': 2, 'text': 'More than half the days'},
                            {'value': 3, 'text': 'Nearly every day'}
                        ]
                    }
                ],
                'scoring': {
                    'min_score': 0,
                    'max_score': 21,
                    'categories': {
                        'minimal': (0, 4),
                        'mild': (5, 9),
                        'moderate': (10, 14),
                        'severe': (15, 21)
                    }
                }
            },
            'stress_pss4': {
                'name': 'PSS-4 Perceived Stress Scale',
                'description': '4-item Perceived Stress Scale for stress assessment',
                'questions': [
                    {
                        'id': 'pss4_1',
                        'text': 'In the last month, how often have you felt that you were unable to control the important things in your life?',
                        'options': [
                            {'value': 0, 'text': 'Never'},
                            {'value': 1, 'text': 'Almost never'},
                            {'value': 2, 'text': 'Sometimes'},
                            {'value': 3, 'text': 'Fairly often'},
                            {'value': 4, 'text': 'Very often'}
                        ]
                    },
                    {
                        'id': 'pss4_2',
                        'text': 'In the last month, how often have you felt confident about your ability to handle your personal problems?',
                        'options': [
                            {'value': 4, 'text': 'Never'},
                            {'value': 3, 'text': 'Almost never'},
                            {'value': 2, 'text': 'Sometimes'},
                            {'value': 1, 'text': 'Fairly often'},
                            {'value': 0, 'text': 'Very often'}
                        ]
                    },
                    {
                        'id': 'pss4_3',
                        'text': 'In the last month, how often have you felt that things were going your way?',
                        'options': [
                            {'value': 4, 'text': 'Never'},
                            {'value': 3, 'text': 'Almost never'},
                            {'value': 2, 'text': 'Sometimes'},
                            {'value': 1, 'text': 'Fairly often'},
                            {'value': 0, 'text': 'Very often'}
                        ]
                    },
                    {
                        'id': 'pss4_4',
                        'text': 'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?',
                        'options': [
                            {'value': 0, 'text': 'Never'},
                            {'value': 1, 'text': 'Almost never'},
                            {'value': 2, 'text': 'Sometimes'},
                            {'value': 3, 'text': 'Fairly often'},
                            {'value': 4, 'text': 'Very often'}
                        ]
                    }
                ],
                'scoring': {
                    'min_score': 0,
                    'max_score': 16,
                    'categories': {
                        'low_stress': (0, 6),
                        'moderate_stress': (7, 10),
                        'high_stress': (11, 16)
                    }
                }
            }
        }

    def _load_scoring_weights(self) -> Dict[str, float]:
        """Load scoring weights for different assessments"""
        return {
            'depression_weight': 0.4,
            'anxiety_weight': 0.3,
            'stress_weight': 0.3
        }

    def assess(self, responses: List[Dict[str, Any]], assessment_type: str = 'comprehensive') -> Dict[str, Any]:
        """
        Perform mental health assessment

        Args:
            responses: List of assessment responses
            assessment_type: Type of assessment ('comprehensive', 'depression', 'anxiety', 'stress')

        Returns:
            Assessment results
        """
        try:
            logger.info(f"Performing {assessment_type} mental health assessment")

            if assessment_type == 'comprehensive':
                return self._comprehensive_assessment(responses)
            elif assessment_type == 'depression':
                return self._depression_assessment(responses)
            elif assessment_type == 'anxiety':
                return self._anxiety_assessment(responses)
            elif assessment_type == 'stress':
                return self._stress_assessment(responses)
            else:
                raise ValueError(f"Unknown assessment type: {assessment_type}")

        except Exception as e:
            logger.error(f"❌ Mental health assessment failed: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'assessment_type': assessment_type
            }

    def _comprehensive_assessment(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform comprehensive mental health assessment

        Args:
            responses: List of assessment responses

        Returns:
            Comprehensive assessment results
        """
        # Group responses by assessment type
        depression_responses = [r for r in responses if r.get('question_id', '').startswith('phq9_')]
        anxiety_responses = [r for r in responses if r.get('question_id', '').startswith('gad7_')]
        stress_responses = [r for r in responses if r.get('question_id', '').startswith('pss4_')]

        # Calculate individual scores
        depression_result = self._depression_assessment(depression_responses) if depression_responses else None
        anxiety_result = self._anxiety_assessment(anxiety_responses) if anxiety_responses else None
        stress_result = self._stress_assessment(stress_responses) if stress_responses else None

        # Calculate overall score
        scores = []
        weights = []

        if depression_result:
            scores.append(depression_result.get('overall_score', 0))
            weights.append(self.scoring_weights['depression_weight'])

        if anxiety_result:
            scores.append(anxiety_result.get('overall_score', 0))
            weights.append(self.scoring_weights['anxiety_weight'])

        if stress_result:
            scores.append(stress_result.get('overall_score', 0))
            weights.append(self.scoring_weights['stress_weight'])

        if scores:
            # Normalize scores to 0-100 scale
            normalized_scores = []
            for score, result in zip(scores, [depression_result, anxiety_result, stress_result]):
                if result:
                    max_score = result.get('max_possible_score', 27)
                    normalized_score = (score / max_score) * 100
                    normalized_scores.append(normalized_score)

            overall_score = np.average(normalized_scores, weights=weights[:len(normalized_scores)]) if HAS_SCIENTIFIC_STACK else sum(normalized_scores) / len(normalized_scores)
        else:
            overall_score = 0

        # Determine overall category
        overall_category = self._determine_overall_category(overall_score)

        # Generate recommendations
        recommendations = self._generate_comprehensive_recommendations(
            depression_result, anxiety_result, stress_result, overall_category
        )

        return {
            'success': True,
            'assessment_type': 'comprehensive',
            'overall_score': round(overall_score, 2),
            'overall_category': overall_category,
            'individual_assessments': {
                'depression': depression_result,
                'anxiety': anxiety_result,
                'stress': stress_result
            },
            'recommendations': recommendations,
            'timestamp': datetime.now().isoformat(),
            'assessment_id': str(uuid.uuid4())
        }

    def _depression_assessment(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform depression assessment using PHQ-9

        Args:
            responses: PHQ-9 responses

        Returns:
            Depression assessment results
        """
        template = self.assessment_templates['depression_phq9']
        total_score = 0

        for response in responses:
            question_id = response.get('question_id', '')
            value = response.get('value', 0)
            total_score += value

        # Determine category
        scoring = template['scoring']
        category = 'minimal'
        for cat, (min_score, max_score) in scoring['categories'].items():
            if min_score <= total_score <= max_score:
                category = cat
                break

        # Generate recommendations
        recommendations = self._generate_depression_recommendations(total_score, category)

        return {
            'success': True,
            'assessment_type': 'depression',
            'tool': 'PHQ-9',
            'total_score': total_score,
            'category': category,
            'max_possible_score': scoring['max_score'],
            'recommendations': recommendations,
            'requires_professional_help': total_score >= 15,
            'risk_level': self._depression_risk_level(total_score)
        }

    def _anxiety_assessment(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform anxiety assessment using GAD-7

        Args:
            responses: GAD-7 responses

        Returns:
            Anxiety assessment results
        """
        template = self.assessment_templates['anxiety_gad7']
        total_score = 0

        for response in responses:
            question_id = response.get('question_id', '')
            value = response.get('value', 0)
            total_score += value

        # Determine category
        scoring = template['scoring']
        category = 'minimal'
        for cat, (min_score, max_score) in scoring['categories'].items():
            if min_score <= total_score <= max_score:
                category = cat
                break

        # Generate recommendations
        recommendations = self._generate_anxiety_recommendations(total_score, category)

        return {
            'success': True,
            'assessment_type': 'anxiety',
            'tool': 'GAD-7',
            'total_score': total_score,
            'category': category,
            'max_possible_score': scoring['max_score'],
            'recommendations': recommendations,
            'requires_professional_help': total_score >= 15,
            'risk_level': self._anxiety_risk_level(total_score)
        }

    def _stress_assessment(self, responses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Perform stress assessment using PSS-4

        Args:
            responses: PSS-4 responses

        Returns:
            Stress assessment results
        """
        template = self.assessment_templates['stress_pss4']
        total_score = 0

        for response in responses:
            question_id = response.get('question_id', '')
            value = response.get('value', 0)
            total_score += value

        # Determine category
        scoring = template['scoring']
        category = 'low_stress'
        for cat, (min_score, max_score) in scoring['categories'].items():
            if min_score <= total_score <= max_score:
                category = cat
                break

        # Generate recommendations
        recommendations = self._generate_stress_recommendations(total_score, category)

        return {
            'success': True,
            'assessment_type': 'stress',
            'tool': 'PSS-4',
            'total_score': total_score,
            'category': category,
            'max_possible_score': scoring['max_score'],
            'recommendations': recommendations,
            'requires_professional_help': total_score >= 13,
            'risk_level': self._stress_risk_level(total_score)
        }

    def _determine_overall_category(self, overall_score: float) -> str:
        """
        Determine overall mental health category

        Args:
            overall_score: Overall score (0-100)

        Returns:
            Overall category
        """
        if overall_score < 25:
            return 'excellent'
        elif overall_score < 40:
            return 'good'
        elif overall_score < 60:
            return 'mild_concerns'
        elif overall_score < 80:
            return 'moderate_concerns'
        else:
            return 'significant_concerns'

    def _generate_depression_recommendations(self, score: int, category: str) -> List[str]:
        """Generate depression-specific recommendations"""
        recommendations = []

        if score >= 20:
            recommendations.extend([
                "Seek immediate professional help from a mental health provider",
                "Consider contacting a crisis helpline if you have thoughts of self-harm",
                "Discuss treatment options with a healthcare provider"
            ])
        elif score >= 15:
            recommendations.extend([
                "Schedule an appointment with a mental health professional",
                "Consider starting therapy or counseling",
                "Discuss medication options with your doctor"
            ])
        elif score >= 10:
            recommendations.extend([
                "Consider talking to a counselor or therapist",
                "Practice regular physical activity",
                "Maintain a consistent sleep schedule",
                "Reach out to friends and family for support"
            ])
        elif score >= 5:
            recommendations.extend([
                "Practice self-care activities",
                "Engage in regular exercise",
                "Ensure adequate sleep",
                "Consider mindfulness or meditation"
            ])
        else:
            recommendations.extend([
                "Continue maintaining healthy habits",
                "Stay connected with supportive relationships",
                "Practice stress management techniques"
            ])

        return recommendations

    def _generate_anxiety_recommendations(self, score: int, category: str) -> List[str]:
        """Generate anxiety-specific recommendations"""
        recommendations = []

        if score >= 15:
            recommendations.extend([
                "Seek professional help from a mental health provider",
                "Consider cognitive behavioral therapy (CBT)",
                "Discuss medication options with your doctor",
                "Practice structured relaxation techniques"
            ])
        elif score >= 10:
            recommendations.extend([
                "Consider talking to a counselor about anxiety management",
                "Practice regular deep breathing exercises",
                "Try progressive muscle relaxation",
                "Limit caffeine and alcohol intake"
            ])
        elif score >= 5:
            recommendations.extend([
                "Practice mindfulness meditation",
                "Engage in regular physical activity",
                "Maintain a consistent sleep schedule",
                "Try journaling to process anxious thoughts"
            ])
        else:
            recommendations.extend([
                "Continue healthy stress management practices",
                "Maintain work-life balance",
                "Practice regular self-care"
            ])

        return recommendations

    def _generate_stress_recommendations(self, score: int, category: str) -> List[str]:
        """Generate stress-specific recommendations"""
        recommendations = []

        if score >= 13:
            recommendations.extend([
                "Seek professional help for stress management",
                "Consider therapy to develop coping strategies",
                "Practice daily stress reduction techniques",
                "Evaluate and reduce major stressors if possible"
            ])
        elif score >= 7:
            recommendations.extend([
                "Practice regular relaxation techniques",
                "Ensure adequate sleep and rest",
                "Engage in regular physical activity",
                "Consider time management strategies"
            ])
        else:
            recommendations.extend([
                "Maintain current healthy coping strategies",
                "Continue regular exercise and good sleep habits",
                "Practice work-life balance"
            ])

        return recommendations

    def _generate_comprehensive_recommendations(self, depression_result: Dict,
                                             anxiety_result: Dict,
                                             stress_result: Dict,
                                             overall_category: str) -> List[str]:
        """Generate comprehensive recommendations"""
        recommendations = []

        # Add overall recommendations based on category
        if overall_category in ['moderate_concerns', 'significant_concerns']:
            recommendations.extend([
                "Consider seeking professional mental health support",
                "Practice regular self-care and stress management",
                "Maintain a healthy lifestyle with exercise and good nutrition",
                "Stay connected with supportive friends and family"
            ])

        # Add specific recommendations based on individual assessments
        if depression_result:
            recommendations.extend(depression_result.get('recommendations', []))
        if anxiety_result:
            recommendations.extend(anxiety_result.get('recommendations', []))
        if stress_result:
            recommendations.extend(stress_result.get('recommendations', []))

        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)

        return unique_recommendations

    def _depression_risk_level(self, score: int) -> str:
        """Determine depression risk level"""
        if score >= 20:
            return 'severe'
        elif score >= 15:
            return 'moderately_severe'
        elif score >= 10:
            return 'moderate'
        elif score >= 5:
            return 'mild'
        else:
            return 'minimal'

    def _anxiety_risk_level(self, score: int) -> str:
        """Determine anxiety risk level"""
        if score >= 15:
            return 'severe'
        elif score >= 10:
            return 'moderate'
        elif score >= 5:
            return 'mild'
        else:
            return 'minimal'

    def _stress_risk_level(self, score: int) -> str:
        """Determine stress risk level"""
        if score >= 13:
            return 'high'
        elif score >= 7:
            return 'moderate'
        else:
            return 'low'

    def get_assessment_template(self, assessment_type: str) -> Dict[str, Any]:
        """
        Get assessment template by type

        Args:
            assessment_type: Type of assessment

        Returns:
            Assessment template
        """
        return self.assessment_templates.get(assessment_type, {})

    def get_available_assessments(self) -> List[Dict[str, str]]:
        """
        Get list of available assessments

        Returns:
            List of available assessments
        """
        return [
            {
                'type': key,
                'name': template['name'],
                'description': template['description']
            }
            for key, template in self.assessment_templates.items()
        ]