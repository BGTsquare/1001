'use client'

import { useState, useCallback } from 'react'
import { Eye, CheckCircle, XCircle, Clock, Image } from 'lucide-react'
import { PURCHASE_STATUS_LABELS } from '@/lib/constants/purchase-status'

interface PurchaseScreenshot {
  id: string
  telegram_file_id: string
  uploaded_at: string
}

interface Purchase {
  id: string
  transaction_reference: string
  item_title: string
  amount_in_birr: number
  status: string
  telegram_chat_id: number
  telegram_user_id: number
  created_at: string
  purchase_screenshots: PurchaseScreenshot[]
}

interface TelegramPurchasesListProps {
    purchases: Purchase[]
}

export function TelegramPurchasesList({ purchases }: TelegramPurchasesListProps) {
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)

    const getStatusIcon = useCallback((status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />
            case 'pending_verification':
                return <Clock className="w-4 h-4 text-yellow-500" />
            default:
                return <Clock className="w-4 h-4 text-gray-400" />
        }
    }, [])

    const getStatusColor = useCallback((status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800'
            case 'rejected':
                return 'bg-red-100 text-red-800'
            case 'pending_verification':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }, [])

    if (purchases.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-4">📱</div>
                <p>No Telegram purchases found</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Book
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Screenshots
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {purchase.transaction_reference}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Chat: {purchase.telegram_chat_id}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                    {purchase.item_title}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                    {purchase.amount_in_birr} Birr
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    {getStatusIcon(purchase.status)}
                                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(purchase.status)}`}>
                                        {PURCHASE_STATUS_LABELS[purchase.status as keyof typeof PURCHASE_STATUS_LABELS] || purchase.status}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                    <Image className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {purchase.purchase_screenshots.length}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(purchase.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                    onClick={() => setSelectedPurchase(purchase)}
                                    className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>View</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Purchase Detail Modal */}
            {selectedPurchase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Purchase Details
                                </h3>
                                <button
                                    onClick={() => setSelectedPurchase(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Order ID</label>
                                    <p className="text-gray-900">{selectedPurchase.transaction_reference}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Status</label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {getStatusIcon(selectedPurchase.status)}
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedPurchase.status)}`}>
                                            {PURCHASE_STATUS_LABELS[selectedPurchase.status as keyof typeof PURCHASE_STATUS_LABELS] || selectedPurchase.status}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Book</label>
                                    <p className="text-gray-900">{selectedPurchase.item_title}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Amount</label>
                                    <p className="text-gray-900">{selectedPurchase.amount_in_birr} Birr</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Telegram Chat ID</label>
                                    <p className="text-gray-900">{selectedPurchase.telegram_chat_id}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500">Created</label>
                                    <p className="text-gray-900">{new Date(selectedPurchase.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {selectedPurchase.purchase_screenshots.length > 0 && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 mb-2 block">
                                        Payment Screenshots ({selectedPurchase.purchase_screenshots.length})
                                    </label>
                                    <div className="space-y-2">
                                        {selectedPurchase.purchase_screenshots.map((screenshot) => (
                                            <div key={screenshot.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <Image className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">
                                                            File ID: {screenshot.telegram_file_id}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Uploaded: {new Date(screenshot.uploaded_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedPurchase.status === 'pending_verification' && (
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-sm text-gray-600 mb-3">
                                        Use these commands in your Telegram admin channel:
                                    </p>
                                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-sm space-y-1">
                                        <div>/approve {selectedPurchase.transaction_reference}</div>
                                        <div>/reject {selectedPurchase.transaction_reference}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}