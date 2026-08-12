import React from 'react';
import {
  Globe,
  Smartphone,
  Monitor,
  Link as LinkIcon,
  Calendar,
  User,
  Mail,
  Building,
} from 'lucide-react';
import { SystemInfo, SupportUser } from '../../types/support';
import { formatDate } from '../../utils/support/ticketUtils';

interface TicketInfoCardProps {
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const TicketInfoCard: React.FC<TicketInfoCardProps> = ({
  title,
  description,
  createdAt,
  updatedAt,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-2xl font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-900">{formatDate(createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Last Updated</p>
            <p className="text-sm text-gray-900">{formatDate(updatedAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface UserInfoCardProps {
  user: SupportUser;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ user }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <User className="h-5 w-5 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Name</p>
            <p className="text-sm text-gray-900">{user.name}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mail className="h-5 w-5 text-gray-400 mt-1" />
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
            <p className="text-sm text-gray-900">{user.email}</p>
          </div>
        </div>
        {user.phone && (
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
              <p className="text-sm text-gray-900">{user.phone}</p>
            </div>
          </div>
        )}
        {user.organization && (
          <div className="flex items-start gap-3">
            <Building className="h-5 w-5 text-gray-400 mt-1" />
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Organization</p>
              <p className="text-sm text-gray-900">{user.organization}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SystemInfoCardProps {
  systemInfo: SystemInfo;
}

export const SystemInfoCard: React.FC<SystemInfoCardProps> = ({ systemInfo }) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Globe className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">Browser</p>
            <p className="text-sm text-gray-900">
              {systemInfo.browser} {systemInfo.browserVersion}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">Device Type</p>
            <p className="text-sm text-gray-900">{systemInfo.deviceType}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Monitor className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">Operating System</p>
            <p className="text-sm text-gray-900">{systemInfo.operatingSystem}</p>
          </div>
        </div>
        {systemInfo.screenResolution && (
          <div className="flex items-start gap-3">
            <Monitor className="h-5 w-5 text-gray-400 mt-1" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">Screen Resolution</p>
              <p className="text-sm text-gray-900">{systemInfo.screenResolution}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-3">
          <LinkIcon className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">Current Page URL</p>
            <p className="text-sm text-gray-900 break-all">
              {systemInfo.currentPageUrl}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar className="h-5 w-5 text-gray-400 mt-1" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-1">Timestamp</p>
            <p className="text-sm text-gray-900">{formatDate(systemInfo.timestamp)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
