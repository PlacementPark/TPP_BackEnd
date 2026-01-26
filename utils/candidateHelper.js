const buildQuery = (type) => {
   switch (type) {
      case "newCandidates":
         return {
            l1Assessment: { $in: ["", null,"DND","Number Not Reachable"] },
            l2Assessment: { $in: ["", null] },
         };
      case "L1L2WrongNumbers":
         return {
            $or: [
               { l1Assessment: "Wrong Number" },
               { l2Assessment: "Wrong Number" },
            ],
         };
      case "Blacklist":
         return {
             l2Assessment: "Blacklist" ,
         };
      case "NonLeads":
         return {
            $or: [
               {
                  l1Assessment: {
                     $in: [
                        "NE-Fresher",
                        "NI-In-Job",
                        "NE-Experienced",
                        "NI-Convincing",
                     ],
                  },
               },
               {
                  l2Assessment: {
                     $in: [
                        "NE-Fresher",
                        "NI-In-Job",
                        "NE-Experienced",
                        "NI-Convincing",
                     ],
                  },
               },
            ],
         };
      case "L1WD":
         return {
            l1Assessment: "WD",
            l2Assessment: { $in: ["", null] },
         };
      case "L2WD":
         return {
            l2Assessment: "WD",
            interviewStatus: { $in: ["", null] },
         };
      case "NSWI":
         return {
            interviewStatus: "No Show Walk-in",
            select: { $in: ["", null] },
         };
      case "NSIC":
         return {
            interviewStatus: "No Show IC",
            select: { $in: ["", null] },
         };
      case "Awaiting":
         return {
            l1Assessment: { $in: ["GOOD", "TAC"] },
            l2Assessment: { $in: ["", null] },
         };
      case "L2DND":
         return {
            l2Assessment: "DND",
            interviewStatus: { $in: ["", null] },
         };
      case "InterviewScheduled":
         return {
            interviewStatus: {
               $in: [
                  "Pending FSR",
                  "Pending Amcat",
                  "Pending Versant",
                  "Pending Technical",
                  "Pending Typing",
                  "Pending Group Discussion",
                  "Pending Ops",
                  "Pending Vice President",
                  "Pending Re-Versant",
                  "Pending Re-Amcat",
                  "Pending Client",
               ],
            },
            select: { $in: ["", null] },
         };
      case "Rejects":
         return {
            interviewStatus: {
               $in: [
                  "Reject FSR Communication",
                  "Reject FSR Stability",
                  "Reject FSR Domain",
                  "Reject Amcat",
                  "Reject Amcat – Technical Issue",
                  "Reject Amcat Cooling Period",
                  "Reject Versant",
                  "Reject Versant – Technical Issue",
                  "Reject Versant Cooling Period",
                  "Reject Technical",
                  "Reject Typing",
                  "Reject Group Discussion",
                  "Reject Ops/Client Communication",
                  "Reject Ops/Client Stability",
                  "Reject Ops/Client Domain",
                  "Reject Vice President",
                  "Source Conflict",
                  "BGV Reject-Pre",
               ],
            },
            select: { $in: ["", null] },
         };
      case "VirtualInterview":
         return {
            interviewStatus: {
               $in: [
                  "TPP Venue",
                  "Client Venue",
                  "Virtual Interview",
                  "TPP Venue-R",
                  "Client Venue-R",
                  "Virtual-R",
                  "Pending Training",
                  "Cooling Period",
               ],
            },
            select: { $in: ["", null] },
         };
      case "OfferDrop":
         return {
            interviewStatus: { $in: ["Tenure-Source Conflict", "Offer Drop"] },
            select: { $in: ["", null] },
         };
      case "AwaitingJoining":
         return {
            interviewStatus: "Select",
            select: { $in: ["", null] },
         };
      case "Hold":
         return {
            interviewStatus: { $in: ["Hold", "TPP FT", "TPP Intern"] },
            select: { $in: ["", null] },
         };
      case "TrackingTenure":
         return { select: { $in: ["Billed & Tracking", "Tracking","Tracking & NR"] } };
      case "InvoiceProcessed":
         return { select: "Invoice Processed" };
      case "Billed":
         return { select: "Billed" };
      case "N2B":
         return { select: "Need to Bill" };
      case "NonTenure":
         return { select: { $in: ["BGV Reject-Post", "Non Tenure"] } };
      case "BusinessTracking":
         return {
            select: {
               $in: ["Tracking", "Need to Bill", "Billed", "Invoice Processed"],
            },
         };
      case "ProcessRampdown":
         return { select: "Process Rampdown" };
      case "ClientRampdown":
         return { select: "Client Rampdown" };
      case "joined":
         return {
            select: {
               $in: ["Tracking", "Non tenure", "Need to Bill", "Billed"],
            },
         };
      case "all":
         return {};
      default:
         return {};
   }
};

module.exports = {
   buildQuery,
};
