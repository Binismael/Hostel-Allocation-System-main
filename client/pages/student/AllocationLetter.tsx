import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { getStudentByEmail } from "@/lib/supabase-db";

const AllocationLetter = () => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [allocation, setAllocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAllocation = async () => {
      try {
        setLoading(true);

        if (!user?.email) {
          setAllocation(null);
          return;
        }

        const { data: student } = await getStudentByEmail(user.email);

        if (!student) {
          setAllocation(null);
          return;
        }

        const { data, error } = await supabase
          .from("allocations")
          .select("*, rooms(room_number, capacity, blocks(name, id))")
          .eq("student_id", student.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error || !data) {
          setAllocation(null);
          return;
        }

        const { data: blockData } = await supabase
          .from("blocks")
          .select("*")
          .eq("id", data.rooms?.blocks?.id)
          .single();

        setAllocation({
          studentName: student.name || "Unknown",
          studentId: student.student_id || "N/A",
          studentEmail: student.email || "N/A",
          room: data.rooms?.room_number || "N/A",
          block: data.rooms?.blocks?.name || "N/A",
          capacity: data.rooms?.capacity || 0,
          allocatedDate: data.allocated_date
            ? new Date(data.allocated_date).toLocaleDateString()
            : new Date().toLocaleDateString(),
          checkinDate: data.checkin_date
            ? new Date(data.checkin_date).toLocaleDateString()
            : new Date(
                Date.now() + 30 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString(),
          blockWarden: blockData?.warden || "Not assigned",
          blockPhone: blockData?.phone_number || "Contact Admin",
        });
      } catch (err) {
        console.error("Failed to load allocation:", err);
        setAllocation(null);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) loadAllocation();
  }, [user?.email, authLoading]);

  const downloadPDF = () => {
    if (!letterRef.current) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      const element = letterRef.current;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Allocation Letter</title>
          <style>
            ${getLetterStyles()}
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);

      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }
  };

  const handlePrint = () => {
    if (!letterRef.current) return;

    const printWindow = window.open("", "", "width=800,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Allocation Letter</title>
          <style>
            ${getLetterStyles()}
          </style>
        </head>
        <body>
          ${letterRef.current.innerHTML}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getLetterStyles = () => `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Poppins', sans-serif;
      line-height: 1.6;
      color: #333;
      background: white;
    }
    .letter-container {
      max-width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.5in;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #333;
    }
    .header h1 {
      font-size: 24px;
      margin-bottom: 0.5rem;
    }
    .header p {
      font-size: 12px;
      color: #666;
    }
    .letter-date {
      text-align: right;
      margin-bottom: 2rem;
      font-size: 12px;
    }
    .recipient-info {
      margin-bottom: 2rem;
      font-size: 13px;
    }
    .salutation {
      margin-bottom: 1rem;
    }
    .letter-body {
      font-size: 13px;
      line-height: 1.8;
      margin-bottom: 2rem;
    }
    .letter-body p {
      margin-bottom: 1rem;
      text-align: justify;
    }
    .details-table {
      width: 100%;
      margin: 1.5rem 0;
      font-size: 12px;
      border-collapse: collapse;
    }
    .details-table td {
      padding: 0.5rem;
      border-bottom: 1px solid #ddd;
    }
    .details-table td:first-child {
      font-weight: bold;
      width: 40%;
    }
    .closing {
      margin-top: 2rem;
    }
    .closing p {
      margin-bottom: 0.5rem;
    }
    .signature-section {
      margin-top: 3rem;
      font-size: 12px;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      margin-top: 3rem;
      margin-bottom: 0.5rem;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .letter-container {
        margin: 0;
        padding: 0.5in;
      }
    }
  `;

  if (loading) {
    return (
      <StudentLayout>
        <p className="text-muted-foreground">Loading allocation letter...</p>
      </StudentLayout>
    );
  }

  if (!allocation) {
    return (
      <StudentLayout>
        <Card className="border border-amber-300 bg-amber-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-900 font-semibold">
                No Approved Allocation
              </p>
              <p className="text-amber-800 text-sm mt-1">
                Your allocation letter is available only after your room request
                has been approved.
              </p>
            </div>
          </div>
        </Card>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={downloadPDF}
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        {/* Letter Container */}
        <div
          ref={letterRef}
          className="bg-white rounded-lg border border-border shadow-sm p-12 max-w-4xl mx-auto"
          style={{ minHeight: "11in", fontFamily: "Poppins, sans-serif" }}
        >
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
            <h1 className="text-2xl font-bold mb-2">
              HOSTEL ALLOCATION LETTER
            </h1>
            <p className="text-sm text-gray-600">
              Foreign Links Campus Hostel Management System
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Room Allocation Authorization Document
            </p>
          </div>

          {/* Date */}
          <div className="text-right mb-8 text-sm">
            <p>
              <span className="font-semibold">Date:</span>{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Recipient */}
          <div className="mb-8 text-sm">
            <p className="font-semibold mb-2">{allocation.studentName}</p>
            <p>{allocation.studentId}</p>
            <p>{allocation.studentEmail}</p>
          </div>

          {/* Salutation */}
          <p className="mb-6 font-semibold text-sm">
            Dear {allocation.studentName},
          </p>

          {/* Body */}
          <div className="space-y-6 text-sm leading-relaxed text-justify">
            <p>
              We are pleased to inform you that your room allocation request has
              been approved. This letter serves as your official hostel
              allocation authorization. Please note the details of your
              allocation and report to the hostel within the stipulated time
              frame.
            </p>

            {/* Allocation Details Table */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="font-semibold mb-4 text-sm">ALLOCATION DETAILS</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4 w-40">
                      Student Name:
                    </td>
                    <td className="py-2">{allocation.studentName}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4">Student ID:</td>
                    <td className="py-2">{allocation.studentId}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4">Hostel Block:</td>
                    <td className="py-2">{allocation.block}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4">Room Number:</td>
                    <td className="py-2">Room {allocation.room}</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4">Room Capacity:</td>
                    <td className="py-2">{allocation.capacity} Bed(s)</td>
                  </tr>
                  <tr className="border-b border-gray-300">
                    <td className="font-semibold py-2 pr-4">
                      Allocation Date:
                    </td>
                    <td className="py-2">{allocation.allocatedDate}</td>
                  </tr>
                  <tr>
                    <td className="font-semibold py-2 pr-4">
                      Check-in Deadline:
                    </td>
                    <td className="py-2">{allocation.checkinDate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              You are hereby allocated <strong>Room {allocation.room}</strong>{" "}
              in the <strong>{allocation.block}</strong> hostel block. This room
              has a capacity of <strong>{allocation.capacity} bed(s)</strong>.
              You must check in on or before the specified deadline.
            </p>

            {/* Important Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="font-semibold text-blue-900 mb-3">
                IMPORTANT INFORMATION
              </p>
              <ul className="list-disc list-inside space-y-2 text-xs text-blue-900">
                <li>
                  Keep this letter safe; you may need to present it during
                  check-in
                </li>
                <li>
                  Failure to check in by the deadline may result in cancellation
                  of your allocation
                </li>
                <li>
                  Report to the hostel warden:{" "}
                  <strong>{allocation.blockWarden}</strong>
                </li>
                <li>
                  For inquiries, contact:{" "}
                  <strong>{allocation.blockPhone}</strong>
                </li>
                <li>Ensure all hostel rules and regulations are followed</li>
                <li>
                  Damage to hostel property will be charged to your account
                </li>
              </ul>
            </div>

            <p>
              Your room allocation is based on your preferences and
              availability. Please familiarize yourself with the hostel rules
              and regulations which are available on the college portal or from
              the hostel management office.
            </p>

            <p>
              Congratulations on your allocation! We wish you a comfortable and
              productive stay in the hostel.
            </p>
          </div>

          {/* Closing */}
          <div className="mt-8">
            <p className="text-sm mb-2">Yours sincerely,</p>
            <div className="mt-12">
              <div className="border-t border-gray-400 w-48 mb-1" />
              <p className="text-sm font-semibold">
                Hostel Management
                <br />
                Foreign Links Campus
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>
              This is an official document. Document ID: {new Date().getTime()}
            </p>
            <p>
              Generated on {new Date().toLocaleDateString()} at{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default AllocationLetter;
