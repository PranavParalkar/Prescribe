import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles, AlertCircle } from "lucide-react";
import DashboardLayout from "../components/layout/DashboardLayout";
import { createPrescription, getPatientById } from "../api/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_MED = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const STEPS = [
  { n: 1, label: "Patient" },
  { n: 2, label: "Medications" },
  { n: 3, label: "Notes" },
];

const MED_VALIDATORS = {
  name: v => /^[a-zA-Z0-9\s\-.,/]{2,100}$/.test(v?.trim()) ? '' : 'Invalid name',
  dosage: v => /^[a-zA-Z0-9\s\-./()]{1,50}$/.test(v?.trim()) ? '' : 'Invalid dosage',
  frequency: v => /^[a-zA-Z0-9\s\-./()]{1,50}$/.test(v?.trim()) ? '' : 'Invalid frequency',
  duration: v => /^[a-zA-Z0-9\s\-./()]{1,50}$/.test(v?.trim()) ? '' : 'Invalid duration',
};

export default function UploadPrescription() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [form, setForm] = useState({
    patientId: "",
    diagnosis: "",
    notes: "",
    followUp: "",
  });
  const [medicines, setMedicines] = useState([{ ...EMPTY_MED }]);
  const [errors, setErrors] = useState({});
  const [verifiedPatient, setVerifiedPatient] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const addMed = () => setMedicines((p) => [...p, { ...EMPTY_MED }]);
  const removeMed = (i) => setMedicines((p) => p.filter((_, idx) => idx !== i));
  const updateMed = (i, k, v) => {
    const newMeds = [...medicines];
    newMeds[i] = { ...newMeds[i], [k]: v };
    setMedicines(newMeds);
  };

  /**
   * Verify a patient by their patientId string.
   * The patientId entered (e.g. PT001234) is the string ID stored in the
   * PatientResponse — we store it as user.entityId for registered patients.
   * We'll use it directly as the patient identifier for the prescription API.
   */
  const verifyPatient = async () => {
    if (!form.patientId.trim()) {
      setErrors({ patientId: "Enter Patient ID" });
      return;
    }
    setVerifying(true);
    setSubmitError("");
    setErrors({});
    try {
      const p = await getPatientById(form.patientId.trim());
      setVerifiedPatient({
        patientId: p.patientId,
        name: p.firstName
          ? `${p.firstName} ${p.lastName}`.trim()
          : `Patient ${p.patientId}`,
      });
    } catch (err) {
      setErrors({ patientId: "Patient not found or invalid ID" });
      setVerifiedPatient(null);
    } finally {
      setVerifying(false);
    }
  };

  const validateStep = (s) => {
    const e = {};
    if (s === 1) {
      if (!verifiedPatient) e.patientId = "Verify Patient ID first";
      if (!form.diagnosis.trim()) e.diagnosis = "Enter a diagnosis";
    }
    if (s === 2) {
      medicines.forEach((m, i) => {
        const nameErr = MED_VALIDATORS.name(m.name);
        const dosageErr = MED_VALIDATORS.dosage(m.dosage);
        const freqErr = MED_VALIDATORS.frequency(m.frequency);
        const durErr = MED_VALIDATORS.duration(m.duration);

        if (nameErr) e[`n${i}`] = nameErr;
        if (dosageErr) e[`d${i}`] = dosageErr;
        if (freqErr) e[`f${i}`] = freqErr;
        if (durErr) e[`dur${i}`] = durErr;
      });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setErrors({});
      setStep((s) => s + 1);
    }
  };
  const prevStep = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Prevent accidental early submit (e.g. pressing Enter on step 1/2).
    // Only save on the final step; otherwise advance the wizard.
    if (step <= 3) {
      nextStep();
      return;
    }
    if (!validateStep(3)) return;
    setSubmitting(true);
    setSubmitError("");

    try {
      const doctorId = user?.entityId;
      const patientId = verifiedPatient?.patientId;

      if (!doctorId)
        throw new Error("Doctor profile ID not found. Please log in again.");
      if (!patientId) throw new Error("Patient ID is missing.");

      const prescriptionBody = {
        diagnosis: form.diagnosis,
        notes: form.notes || null,
        medicines: medicines.map((m) => ({
          medicineName: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions || null,
        })),
      };

      await createPrescription(patientId, doctorId, prescriptionBody);
      setSaved(true);
      setTimeout(() => navigate("/dashboard"), 1800);
    } catch (err) {
      setSubmitError(
        err.message || "Failed to save prescription. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (saved) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] gap-5">
          <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center shadow-elev-4 animate-bounce">
            <Check className="w-12 h-12 text-white" strokeWidth={3} />
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 mb-2">
              Prescription Saved!
            </p>
            <p className="text-base text-slate-400">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">
            Doctor Portal
          </p>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-teal-500 animate-pulse" />
            New Prescription
          </h1>
        </div>
      </div>

      <div className="max-w-3xl pb-8">
        {/* Step Indicator */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map(({ n, label }, idx) => {
            const done = n < step;
            const active = n === step;
            const pending = n > step;
            return (
              <div key={n} className="flex items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all duration-300
                    ${done ? "bg-teal-600 text-white scale-110" : ""}
                    ${active ? "bg-navy-700 text-white ring-4 ring-navy-100 scale-110" : ""}
                    ${pending ? "bg-slate-100 text-slate-400" : ""}`}
                  >
                    {done ? <Check className="w-5 h-5" strokeWidth={2.5} /> : n}
                  </div>
                  <span
                    className={`text-sm font-semibold transition-colors ${active ? "text-slate-900" : "text-slate-400"}`}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`mx-2 sm:mx-4 flex-1 h-1 w-12 sm:w-16 rounded-full transition-all duration-500 ${done ? "bg-teal-400" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {submitError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-3 overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-surface-1 to-white">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Patient Verification
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter Patient ID to verify and proceed
                </p>
              </div>
              <div className="p-5 sm:p-7 flex flex-col gap-6">
                {/* Patient ID Input + Verify */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">
                    Patient ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.patientId}
                      onChange={(e) => {
                        set("patientId", e.target.value.toUpperCase());
                        setVerifiedPatient(null);
                        setErrors({});
                      }}
                      placeholder="e.g. PT001234"
                      disabled={verifying}
                      className={`flex-1 px-4 py-3 text-sm rounded-xl border-2 bg-surface-1 text-slate-800 outline-none transition-all uppercase
                        ${errors.patientId ? "border-red-400 ring-4 ring-red-100" : verifiedPatient ? "border-teal-500 ring-4 ring-teal-100" : "border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"}`}
                    />
                    <button
                      type="button"
                      onClick={verifyPatient}
                      disabled={verifying || !form.patientId.trim()}
                      className="px-6 py-3 rounded-xl text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-elev-1 hover:shadow-elev-2 active:scale-95 whitespace-nowrap"
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                  {errors.patientId && (
                    <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.patientId}
                    </div>
                  )}
                </div>

                {/* Verified Patient Info */}
                {verifiedPatient && (
                  <div className="bg-teal-50 border-2 border-teal-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                      {verifiedPatient.patientId.slice(2, 4)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Check
                          className="w-4 h-4 text-teal-600"
                          strokeWidth={2.5}
                        />
                        <p className="text-sm font-bold text-teal-900">
                          Patient Found
                        </p>
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        {verifiedPatient.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ID: {verifiedPatient.patientId}
                      </p>
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">
                    Diagnosis
                  </label>
                  <input
                    type="text"
                    value={form.diagnosis}
                    onChange={(e) => set("diagnosis", e.target.value)}
                    placeholder="e.g. Acute respiratory infection"
                    disabled={!verifiedPatient}
                    className={`w-full px-4 py-3 text-sm rounded-xl border-2 bg-surface-1 text-slate-800 outline-none transition-all
                      ${errors.diagnosis ? "border-red-400 ring-4 ring-red-100" : "border-slate-200 hover:border-slate-300 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"}
                      ${!verifiedPatient ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {errors.diagnosis && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.diagnosis}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-3 overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-surface-1 to-white">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Medications
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Add one or more medicines to this prescription
                </p>
              </div>
              <div className="px-4 sm:px-7 pb-7 pt-6 flex flex-col gap-5 max-h-[calc(100vh-400px)] overflow-y-auto">
                {medicines.map((med, i) => (
                  <div
                    key={i}
                    className="relative bg-gradient-to-br from-surface-1 to-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 hover:border-teal-300 hover:shadow-elev-2 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-navy-700 text-white text-sm font-bold flex items-center justify-center shadow-elev-2">
                          {i + 1}
                        </div>
                        <span className="text-base font-bold text-slate-700">
                          Medicine {i + 1}
                        </span>
                      </div>
                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMed(i)}
                          className="text-sm text-red-500 hover:text-red-700 font-semibold hover:scale-110 transition-transform"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Name
                        </label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={(e) => updateMed(i, "name", e.target.value)}
                          placeholder="Amoxicillin"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border-2 bg-surface-1 outline-none transition-all ${errors[`n${i}`] ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:border-teal-500"}`}
                        />
                        {errors[`n${i}`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`n${i}`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Dosage
                        </label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) =>
                            updateMed(i, "dosage", e.target.value)
                          }
                          placeholder="500mg"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border-2 bg-surface-1 outline-none transition-all ${errors[`d${i}`] ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:border-teal-500"}`}
                        />
                        {errors[`d${i}`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`d${i}`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Frequency
                        </label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) =>
                            updateMed(i, "frequency", e.target.value)
                          }
                          placeholder="3x daily"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border-2 bg-surface-1 outline-none transition-all ${errors[`f${i}`] ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:border-teal-500"}`}
                        />
                        {errors[`f${i}`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`f${i}`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Duration
                        </label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) =>
                            updateMed(i, "duration", e.target.value)
                          }
                          placeholder="7 days"
                          className={`w-full px-3.5 py-2.5 text-sm rounded-lg border-2 bg-surface-1 outline-none transition-all ${errors[`dur${i}`] ? "border-red-400 focus:ring-red-50" : "border-slate-200 focus:border-teal-500"}`}
                        />
                        {errors[`dur${i}`] && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors[`dur${i}`]}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Instructions (optional)
                      </label>
                      <input
                        type="text"
                        value={med.instructions}
                        onChange={(e) =>
                          updateMed(i, "instructions", e.target.value)
                        }
                        placeholder="e.g. Take with food"
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border-2 border-slate-200 bg-surface-1 outline-none focus:border-teal-500 transition-all"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMed}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-500 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50 transition-all duration-300 hover:scale-105"
                >
                  <span className="text-xl">+</span> Add Another Medicine
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-elev-3 overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-surface-1 to-white">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-500" />
                  Clinical Notes &amp; Follow-up
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Optional additional instructions for the patient
                </p>
              </div>
              <div className="p-5 sm:p-7 flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.12em]">
                    Doctor Notes
                  </label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={5}
                    placeholder="Any extra instructions for the patient…"
                    className="w-full px-4 py-3 text-sm rounded-xl border-2 border-slate-200 bg-surface-1 text-slate-800 placeholder-slate-400 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 resize-none transition-all hover:border-slate-300 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={step === 1 ? () => navigate("/dashboard") : prevStep}
              className="px-6 py-3 rounded-xl text-sm font-semibold border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-95 w-full sm:w-auto"
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            <div className="flex items-center gap-4 w-full sm:w-auto justify-between">
              <div className="flex gap-2">
                {STEPS.map((s) => (
                  <div
                    key={s.n}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${s.n === step ? "bg-navy-700 w-6" : s.n < step ? "bg-teal-400" : "bg-slate-200"}`}
                  />
                ))}
              </div>

              {step <= 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-navy-700 hover:bg-navy-800 shadow-elev-2 hover:shadow-elev-3 transition-all active:scale-95 w-full sm:w-auto justify-center"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-elev-2 hover:shadow-elev-3 transition-all active:scale-95 w-full sm:w-auto justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                      Save Prescription
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
