"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import type { PropertyListItem, PropertyDetailItem } from "@/server/types";
import { PropertyStatus } from "@/server/types/property";

const approvalSchema = z.object({
  status: z.nativeEnum(PropertyStatus, {
    errorMap: () => ({ message: "Please select an action" })
  }),
  rejectionReason: z.string().optional(),
}).refine((data) => {
  if ((data.status === PropertyStatus.REJECTED || data.status === PropertyStatus.SUSPENDED) && !data.rejectionReason?.trim()) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting or suspending a property",
  path: ["rejectionReason"],
}).refine((data) => {
  if (data.rejectionReason && data.rejectionReason.trim().length > 500) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason must be less than 500 characters",
  path: ["rejectionReason"],
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface PropertyApprovalDialogProps {
  property: PropertyListItem | PropertyDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const statusOptions = [
  {
    value: PropertyStatus.APPROVED,
    label: "Setujui Properti",
    description: "Properti akan ditampilkan di halaman publik",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-100 dark:bg-green-900",
  },
  {
    value: PropertyStatus.REJECTED,
    label: "Tolak Properti",
    description: "Properti akan ditolak dan tidak ditampilkan",
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-100 dark:bg-red-900",
  },
  {
    value: PropertyStatus.SUSPENDED,
    label: "Suspend Properti",
    description: "Properti akan disuspend sementara",
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-100 dark:bg-orange-900",
  },
];

export function PropertyApprovalDialog({
  property,
  open,
  onOpenChange,
  onSuccess,
}: PropertyApprovalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      status: PropertyStatus.APPROVED,
      rejectionReason: "",
    },
  });

  const watchedStatus = form.watch("status");
  const needsReason = watchedStatus === PropertyStatus.REJECTED || watchedStatus === PropertyStatus.SUSPENDED;

  const onSubmit = async (data: ApprovalFormData) => {
    if (!property) return;

    try {
      setIsSubmitting(true);

      // Clean up data - remove empty rejectionReason if not needed
      const submitData = {
        status: data.status,
        ...(data.rejectionReason?.trim() && { rejectionReason: data.rejectionReason.trim() })
      };

      console.log("Submitting approval data:", submitData);

      const response = await fetch(`/api/properties/${property.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process approval");
      }

      const actionText = data.status === PropertyStatus.APPROVED 
        ? "disetujui" 
        : data.status === PropertyStatus.REJECTED 
        ? "ditolak" 
        : "disuspend";

      toast.success(`Properti berhasil ${actionText}`);
      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error processing approval:", error);
      toast.error(error instanceof Error ? error.message : "Gagal memproses persetujuan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  if (!property) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Properti</DialogTitle>
          <DialogDescription>
            Tinjau dan berikan keputusan untuk properti "{property.name}"
          </DialogDescription>
        </DialogHeader>

        {/* Property Info */}
        <div className="space-y-3 py-4 border-y">
          <div>
            <h4 className="font-medium">{property.name}</h4>
            <p className="text-sm text-muted-foreground">
              {property.location?.districtName}, {property.location?.regencyName}
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <span>{property.totalRooms} kamar</span>
            <span>{property.availableRooms} tersedia</span>
            <Badge variant="secondary">
              {property.status === PropertyStatus.PENDING ? "Menunggu Review" : property.status}
            </Badge>
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Pemilik:</span> {property.owner?.name || property.owner?.email}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Status Selection */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keputusan</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="space-y-3"
                    >
                      {statusOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <div key={option.value} className="flex items-center space-x-3">
                            <RadioGroupItem value={option.value} id={option.value} />
                            <label
                              htmlFor={option.value}
                              className="flex items-center gap-3 cursor-pointer flex-1"
                            >
                              <div className={`p-2 rounded-lg ${option.bgColor}`}>
                                <Icon className={`h-4 w-4 ${option.color}`} />
                              </div>
                              <div>
                                <div className="font-medium">{option.label}</div>
                                <div className="text-sm text-muted-foreground">
                                  {option.description}
                                </div>
                              </div>
                            </label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rejection/Suspension Reason */}
            {needsReason && (
              <FormField
                control={form.control}
                name="rejectionReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Alasan {watchedStatus === PropertyStatus.REJECTED ? "Penolakan" : "Suspend"}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={`Jelaskan alasan ${watchedStatus === PropertyStatus.REJECTED ? "penolakan" : "suspend"} properti ini...`}
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Memproses..." : "Konfirmasi"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
