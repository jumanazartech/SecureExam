/**
 * Rasch Model Scoring Engine
 * 
 * Implements the Rasch model for psychometric assessment:
 * P(correct) = exp(θ - b) / (1 + exp(θ - b))
 * 
 * Where:
 * - θ (theta) = Student ability parameter
 * - b = Question difficulty parameter
 */

/**
 * Calculate the probability of a correct response using the Rasch model
 * @param {number} theta - Student ability parameter
 * @param {number} difficulty - Question difficulty parameter (b)
 * @returns {number} Probability of correct response (0-1)
 */
function calculateProbability(theta, difficulty) {
    const exponent = theta - difficulty;
    return Math.exp(exponent) / (1 + Math.exp(exponent));
}

/**
 * Estimate student ability (θ) using Maximum Likelihood Estimation
 * Uses Newton-Raphson iterative method to find θ that maximizes likelihood
 * 
 * @param {Array} responses - Array of response objects: [{isCorrect: boolean, difficulty: number}]
 * @param {number} initialTheta - Starting value for θ (default: 0)
 * @param {number} maxIterations - Maximum iterations (default: 50)
 * @param {number} tolerance - Convergence tolerance (default: 0.001)
 * @returns {number} Estimated ability parameter (θ)
 */
function estimateAbility(responses, initialTheta = 0, maxIterations = 50, tolerance = 0.001) {
    if (!responses || responses.length === 0) {
        return 0; // Return neutral ability if no responses
    }

    let theta = initialTheta;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
        let firstDerivative = 0;  // dL/dθ
        let secondDerivative = 0; // d²L/dθ²

        // Calculate derivatives for Newton-Raphson
        for (const response of responses) {
            const { isCorrect, difficulty } = response;
            const prob = calculateProbability(theta, difficulty);

            // First derivative (score function)
            if (isCorrect) {
                firstDerivative += (1 - prob);
            } else {
                firstDerivative += (-prob);
            }

            // Second derivative (information function)
            secondDerivative += (-prob * (1 - prob));
        }

        // Newton-Raphson update
        if (Math.abs(secondDerivative) < 1e-10) {
            break; // Avoid division by zero
        }

        const thetaChange = -firstDerivative / secondDerivative;
        theta += thetaChange;

        // Check for convergence
        if (Math.abs(thetaChange) < tolerance) {
            break;
        }

        // Prevent extreme values
        theta = Math.max(-6, Math.min(6, theta));
    }

    return theta;
}

/**
 * Convert Rasch ability (θ) to standardized score (0-100)
 * Maps θ range of approximately [-3, +3] to 0-100 scale
 * 
 * @param {number} theta - Student ability parameter
 * @returns {number} Standardized score (0-100)
 */
function convertToStandardScore(theta) {
    // Typical θ range is approximately -3 to +3
    // Map this to 0-100 scale
    // Using a logistic transformation for smooth mapping

    // Center at θ = 0 (50 points)
    // θ = -3 → ~0 points
    // θ = +3 → ~100 points

    const score = 50 + (theta * 16.67); // Linear mapping: θ * (50/3)

    // Clamp to 0-100 range
    return Math.max(0, Math.min(100, score));
}

/**
 * Determine certificate level based on Rasch score
 * 
 * @param {number} score - Rasch standardized score (0-100)
 * @returns {string} Certificate level (A+, A, B+, B, C+, C, or Fail)
 */
function getCertificateLevel(score) {
    if (score >= 70.0) return 'A+';
    if (score >= 65.0) return 'A';
    if (score >= 60.0) return 'B+';
    if (score >= 55.0) return 'B';
    if (score >= 50.0) return 'C+';
    if (score >= 46.0) return 'C';
    return 'Fail';
}

/**
 * Update question difficulty parameter based on response data
 * Uses proportion correct to estimate difficulty
 * 
 * @param {number} correctCount - Number of correct responses
 * @param {number} totalCount - Total number of responses
 * @returns {number} Updated difficulty parameter (b)
 */
function updateDifficultyParameter(correctCount, totalCount) {
    if (totalCount === 0) return 0;

    const proportionCorrect = correctCount / totalCount;

    // Avoid extreme proportions
    const p = Math.max(0.01, Math.min(0.99, proportionCorrect));

    // Convert proportion to difficulty using logit transformation
    // b = -ln(p / (1 - p))
    const difficulty = -Math.log(p / (1 - p));

    return difficulty;
}

/**
 * Calculate partial credit for Type 3 dual-answer questions
 * 
 * @param {boolean} isCorrect1 - First answer correctness
 * @param {boolean} isCorrect2 - Second answer correctness
 * @returns {number} Partial credit (0.0, 0.5, or 1.0)
 */
function calculatePartialCredit(isCorrect1, isCorrect2) {
    if (isCorrect1 && isCorrect2) return 1.0;  // Both correct
    if (isCorrect1 || isCorrect2) return 0.5;  // One correct
    return 0.0;  // Both incorrect
}

/**
 * Check if an answer matches acceptable variants
 * Case-insensitive comparison with trimming
 * 
 * @param {string} studentAnswer - Student's answer
 * @param {Array<string>} variants - Array of acceptable answer variants
 * @returns {boolean} True if answer matches any variant
 */
function checkAnswerVariant(studentAnswer, variants) {
    if (!studentAnswer || !variants || variants.length === 0) {
        return false;
    }

    const normalizedAnswer = studentAnswer.trim().toLowerCase();

    return variants.some(variant =>
        variant.trim().toLowerCase() === normalizedAnswer
    );
}

module.exports = {
    calculateProbability,
    estimateAbility,
    convertToStandardScore,
    getCertificateLevel,
    updateDifficultyParameter,
    calculatePartialCredit,
    checkAnswerVariant
};
