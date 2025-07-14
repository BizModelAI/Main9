import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import {
  DollarSign,
  RefreshCw,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

interface Payment {
  id: number;
  userId: number;
  amount: string;
  currency: string;
  type: string;
  stripePaymentIntentId: string;
  status: string;
  retakesGranted: number;
  createdAt: string;
  completedAt?: string;
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

interface Refund {
  id: number;
  paymentId: number;
  amount: string;
  currency: string;
  reason: string;
  status: string;
  stripeRefundId?: string;
  paypalRefundId?: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
}

const AdminPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "requested_by_customer",
    adminNote: "",
  });
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  const fetchPayments = async () => {
    if (!adminKey) return;

    setLoading(true);
    try {
      const response = await fetch("/api/admin/payments", {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      } else {
        console.error("Failed to fetch payments");
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRefunds = async () => {
    if (!adminKey) return;

    try {
      const response = await fetch("/api/admin/refunds", {
        headers: {
          "x-admin-key": adminKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRefunds(data);
      }
    } catch (error) {
      console.error("Error fetching refunds:", error);
    }
  };

  const processRefund = async () => {
    if (!selectedPayment || !adminKey) return;

    setIsProcessingRefund(true);
    try {
      const response = await fetch("/api/admin/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          paymentId: selectedPayment.id,
          amount: refundForm.amount,
          reason: refundForm.reason,
          adminNote: refundForm.adminNote,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Refund processed successfully! Refund ID: ${result.refund.id}`);
        setSelectedPayment(null);
        setRefundForm({
          amount: "",
          reason: "requested_by_customer",
          adminNote: "",
        });
        fetchPayments();
        fetchRefunds();
      } else {
        alert(`Refund failed: ${result.error}`);
      }
    } catch (error) {
      console.error("Error processing refund:", error);
      alert("Error processing refund");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  useEffect(() => {
    if (adminKey) {
      fetchPayments();
      fetchRefunds();
    }
  }, [adminKey]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "succeeded":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === "completed" || status === "succeeded"
        ? "default"
        : status === "failed"
          ? "destructive"
          : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Payment Admin
          </h1>
          <p className="text-gray-600">Manage payments and process refunds</p>
        </div>

        {/* Admin Key Input */}
        {!adminKey && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Input
                  type="password"
                  placeholder="Enter admin API key"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={fetchPayments} disabled={!adminKey}>
                  Access Admin Panel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {adminKey && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Payments
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {payments.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Completed
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {
                          payments.filter((p) => p.status === "completed")
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <RefreshCw className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Refunds
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {refunds.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        $
                        {payments
                          .filter((p) => p.status === "completed")
                          .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                          .toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Payments List */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Recent Payments</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPayments}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(payment.status)}
                            <span className="font-medium">#{payment.id}</span>
                            {getStatusBadge(payment.status)}
                          </div>
                          <span className="font-bold">${payment.amount}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>User: {payment.user?.email || "Unknown"}</p>
                          <p>Type: {payment.type}</p>
                          <p>
                            Date:{" "}
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refund Form */}
              {selectedPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Process Refund - Payment #{selectedPayment.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Payment Details</h4>
                      <p>
                        <strong>Amount:</strong> ${selectedPayment.amount}
                      </p>
                      <p>
                        <strong>User:</strong> {selectedPayment.user?.email}
                      </p>
                      <p>
                        <strong>Type:</strong> {selectedPayment.type}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(
                          selectedPayment.createdAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Refund Amount
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Amount to refund"
                        value={refundForm.amount}
                        onChange={(e) =>
                          setRefundForm({
                            ...refundForm,
                            amount: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Reason
                      </label>
                      <select
                        className="w-full p-2 border rounded-md"
                        value={refundForm.reason}
                        onChange={(e) =>
                          setRefundForm({
                            ...refundForm,
                            reason: e.target.value,
                          })
                        }
                      >
                        <option value="requested_by_customer">
                          Requested by Customer
                        </option>
                        <option value="duplicate">Duplicate Payment</option>
                        <option value="fraudulent">Fraudulent</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Admin Note (Optional)
                      </label>
                      <Textarea
                        placeholder="Add any notes about this refund..."
                        value={refundForm.adminNote}
                        onChange={(e) =>
                          setRefundForm({
                            ...refundForm,
                            adminNote: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={processRefund}
                        disabled={!refundForm.amount || isProcessingRefund}
                        className="flex-1"
                      >
                        {isProcessingRefund
                          ? "Processing..."
                          : "Process Refund"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedPayment(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Refunds List */}
              {!selectedPayment && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Refunds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {refunds.map((refund) => (
                        <div key={refund.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(refund.status)}
                              <span className="font-medium">
                                Refund #{refund.id}
                              </span>
                              {getStatusBadge(refund.status)}
                            </div>
                            <span className="font-bold">-${refund.amount}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Payment ID: #{refund.paymentId}</p>
                            <p>Reason: {refund.reason}</p>
                            <p>
                              Date:{" "}
                              {new Date(refund.createdAt).toLocaleDateString()}
                            </p>
                            {refund.adminNote && (
                              <p>Note: {refund.adminNote}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
