"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Mic,
  Edit3,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Trash2,
  Download,
  BarChart3,
  PieChart,
  History,
  ShoppingCart,
  Coffee,
  Car,
  Home,
  Gamepad2,
  Heart,
  BookOpen,
  Smartphone,
  Save,
  Sparkles,
} from "lucide-react"
import Image from "next/image"


// 数据类型定义
interface Expense {
  id: number
  amount: number
  title: string
  category: string
  time: string
  date: string
  timestamp: number
}

interface Category {
  id: number
  name: string
  icon: string
  color: string
}

// 图标映射
const iconMap: { [key: string]: any } = {
  Coffee,
  Car,
  Home,
  Gamepad2,
  Heart,
  BookOpen,
  Smartphone,
  ShoppingCart,
}

export default function VoiceAccountingApp() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("record")
  const [isManualDialogOpen, setIsManualDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [statsTimeRange, setStatsTimeRange] = useState("month")
  
  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // 数据状态
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([
    { id: 1, name: "餐饮", icon: "Coffee", color: "bg-orange-500" },
    { id: 2, name: "交通", icon: "Car", color: "bg-blue-500" },
    { id: 3, name: "生活", icon: "Home", color: "bg-green-500" },
    { id: 4, name: "娱乐", icon: "Gamepad2", color: "bg-purple-500" },
    { id: 5, name: "医疗", icon: "Heart", color: "bg-red-500" },
    { id: 6, name: "学习", icon: "BookOpen", color: "bg-indigo-500" },
    { id: 7, name: "数码", icon: "Smartphone", color: "bg-gray-500" },
  ])

  const [newExpense, setNewExpense] = useState({
    amount: "",
    title: "",
    category: "",
    time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
  })

  const [newCategory, setNewCategory] = useState({
    name: "",
    icon: "ShoppingCart",
    color: "bg-gray-500",
  })

  // 数据持久化
  useEffect(() => {
    const savedExpenses = localStorage.getItem("expenses")
    const savedCategories = localStorage.getItem("categories")

    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses))
    }
    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("expenses", JSON.stringify(expenses))
  }, [expenses])

  useEffect(() => {
    localStorage.setItem("categories", JSON.stringify(categories))
  }, [categories])

  // 计算统计数据
  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // 本月支出
    const monthlyExpenses = expenses.filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })

    const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0)

    // 今日支出
    const today = now.toISOString().split("T")[0]
    const todayExpenses = expenses.filter((expense) => expense.date === today)

    // 分类统计
    const categoryStats = categories
      .map((category) => {
        const categoryExpenses = monthlyExpenses.filter((expense) => expense.category === category.name)
        const amount = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        return {
          category: category.name,
          amount,
          percentage: monthlyTotal > 0 ? Math.round((amount / monthlyTotal) * 100) : 0,
        }
      })
      .filter((stat) => stat.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    // 月度趋势（最近6个月）
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1)
      const monthExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date)
        return (
          expenseDate.getMonth() === targetDate.getMonth() && expenseDate.getFullYear() === targetDate.getFullYear()
        )
      })
      const amount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      monthlyTrends.push({
        month: targetDate.toLocaleDateString("zh-CN", { month: "short" }),
        amount,
      })
    }

    return {
      monthlyTotal,
      todayExpenses,
      categoryStats,
      monthlyTrends,
    }
  }, [expenses, categories])

  // 录音功能实现
  const startRecording = async () => {
    console.log('开始录音功能被调用');
    try {
      setRecordingError(null);
      console.log('请求麦克风权限');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('麦克风权限已获取');
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('录音数据可用');
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      console.log('录音已开始');
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      let errorMessage = '无法访问麦克风。请确保已授予麦克风权限。';
      
      // 特别处理设备未找到的错误
      if (err.name === 'NotFoundError' || err.message.includes('not found')) {
        errorMessage = '未找到可用的麦克风设备。请检查设备连接或选择其他录音方式。';
      } else if (err.name === 'NotAllowedError' || err.message.includes('denied')) {
        errorMessage = '麦克风访问被拒绝。请在浏览器设置中允许麦克风权限。';
      } else if (err.name === 'OverconstrainedError' || err.message.includes('overconstrained')) {
        errorMessage = '麦克风配置不正确。请检查设备设置。';
      }
      
      setRecordingError(errorMessage);
      
      // 显示错误提示
      toast({
        title: "录音失败",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    console.log('停止录音功能被调用');
    try {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        console.log('录音已停止');
        setIsRecording(false);

        // Stop all media tracks
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

        // Clear recording timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
        }

        // Handle recording complete
        mediaRecorderRef.current.onstop = async () => {
          console.log('录音完成事件触发');
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
            console.log('开始上传录音');
            await uploadRecording(audioBlob);
          } catch (err) {
            console.error('Failed to process recording:', err);
            const errorMessage = '录音处理失败，请重试。';
            setRecordingError(errorMessage);
            
            // 显示错误提示
            toast({
              title: "录音处理失败",
              description: errorMessage,
              variant: "destructive",
            });
          }
        };
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      const errorMessage = '停止录音失败，请重试。';
      setRecordingError(errorMessage);
      
      // 显示错误提示
      toast({
        title: "停止录音失败",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const uploadRecording = async (audioBlob: Blob) => {
    try {
      setIsUploading(true);
      setRecordingError(null);
      
      // 实际上传逻辑
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      // 替换为您的实际API端点
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      toast({
        title: "录音已保存",
        description: "您的语音记账已成功保存",
      });
      
      return true;
    } catch (err) {
      console.error('Failed to upload recording:', err);
      const errorMessage = '录音上传失败，请重试。';
      setRecordingError(errorMessage);
      
      // 显示错误提示
      toast({
        title: "录音上传失败",
        description: errorMessage,
        variant: "destructive",
      });
      
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 格式化录音时间
  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 添加支出记录
  const handleManualSubmit = () => {
    if (!newExpense.amount || !newExpense.title || !newExpense.category) {
      toast({
        title: "请填写完整信息",
        description: "金额、标题和分类都是必填项",
        variant: "destructive",
      })
      return
    }

    const expense: Expense = {
      id: Date.now(),
      amount: Number.parseFloat(newExpense.amount),
      title: newExpense.title,
      category: newExpense.category,
      time: newExpense.time,
      date: new Date().toISOString().split("T")[0],
      timestamp: Date.now(),
    }

    setExpenses((prev) => [expense, ...prev])
    setIsManualDialogOpen(false)
    setNewExpense({
      amount: "",
      title: "",
      category: "",
      time: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    })

    toast({
      title: "记录已保存",
      description: `成功添加支出记录：${expense.title}`,
    })
  }

  // 分类管理功能
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "请输入分类名称",
        variant: "destructive",
      })
      return
    }

    const category: Category = {
      id: Date.now(),
      name: newCategory.name.trim(),
      icon: newCategory.icon,
      color: newCategory.color,
    }

    setCategories((prev) => [...prev, category])
    setNewCategory({ name: "", icon: "ShoppingCart", color: "bg-gray-500" })
    setIsCategoryDialogOpen(false)

    toast({
      title: "分类已添加",
      description: `成功添加分类：${category.name}`,
    })
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setNewCategory({
      name: category.name,
      icon: category.icon,
      color: category.color,
    })
    setIsCategoryDialogOpen(true)
  }

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name.trim()) return

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === editingCategory.id
          ? { ...cat, name: newCategory.name.trim(), icon: newCategory.icon, color: newCategory.color }
          : cat,
      ),
    )

    // 更新相关支出记录的分类名称
    if (editingCategory.name !== newCategory.name.trim()) {
      setExpenses((prev) =>
        prev.map((expense) =>
          expense.category === editingCategory.name ? { ...expense, category: newCategory.name.trim() } : expense,
        ),
      )
    }

    setEditingCategory(null)
    setNewCategory({ name: "", icon: "ShoppingCart", color: "bg-gray-500" })
    setIsCategoryDialogOpen(false)

    toast({
      title: "分类已更新",
      description: `成功更新分类信息`,
    })
  }

  const handleDeleteCategory = (categoryId: number) => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category) return

    // 检查是否有相关支出记录
    const relatedExpenses = expenses.filter((expense) => expense.category === category.name)
    if (relatedExpenses.length > 0) {
      toast({
        title: "无法删除分类",
        description: "该分类下还有支出记录，请先删除相关记录",
        variant: "destructive",
      })
      return
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    toast({
      title: "分类已删除",
      description: `成功删除分类：${category.name}`,
    })
  }

  // 数据导出功能
  const handleExportData = () => {
    const csvContent = [
      ["日期", "时间", "标题", "分类", "金额"],
      ...expenses.map((expense) => [
        expense.date,
        expense.time,
        expense.title,
        expense.category,
        expense.amount.toString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `记账数据_${new Date().toISOString().split("T")[0]}.csv`
    link.click()

    toast({
      title: "数据导出成功",
      description: "CSV文件已下载到本地",
    })
  }

  // 清除所有数据
  const handleClearAllData = () => {
    setExpenses([])
    localStorage.removeItem("expenses")
    toast({
      title: "数据已清除",
      description: "所有支出记录已删除",
    })
  }

  // 工具函数
  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    return category ? iconMap[category.icon] || ShoppingCart : ShoppingCart
  }

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((cat) => cat.name === categoryName)
    return category ? category.color : "bg-gray-500"
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`
  }

  const groupExpensesByDate = (expenses: Expense[]) => {
    const groups: { [key: string]: Expense[] } = {}
    expenses.forEach((expense) => {
      if (!groups[expense.date]) {
        groups[expense.date] = []
      }
      groups[expense.date].push(expense)
    })
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 opacity-5">
        <Image src="/images/hero-bg.png" alt="Background" fill className="object-cover" priority />
      </div>

      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-20">
            <Sparkles className="h-16 w-16" />
          </div>
          <h1 className="text-xl font-bold text-center relative z-10">智能记账</h1>
          <p className="text-center text-sm opacity-90 mt-1">让记账变得简单有趣</p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden">
            {/* 记账页面 */}
            <TabsContent value="record" className="m-0 p-4 space-y-4">
              {/* 本月支出卡片 */}
              <Card className="bg-gradient-to-r from-red-500 to-pink-500 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-20">
                  <Image
                    src="/images/money-management.png"
                    alt="Money Management"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
                <CardContent className="p-4 relative z-10">
                  <div className="text-center">
                    <p className="text-sm opacity-90">本月支出</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.monthlyTotal)}</p>
                    <p className="text-xs opacity-75">
                      共{
                        expenses.filter((e) => {
                          const expenseDate = new Date(e.date)
                          const now = new Date()
                          return (
                            expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
                          )
                        }).length
                      } 笔记录
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 输入按钮 */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
                  <CardContent 
                    className="p-4 h-24 flex flex-col gap-2 bg-blue-500 hover:bg-blue-600 relative overflow-hidden rounded-lg cursor-pointer items-center justify-center"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    <div className="absolute inset-0 opacity-20">
                      <Image src="/images/voice-recording.png" alt="Voice Recording" fill className="object-contain" />
                    </div>
                    {isRecording ? (
                      <>
                        <div className="h-6 w-6 relative z-10 text-white">
                          <div className="h-4 w-4 bg-white rounded-sm absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        </div>
                        <span className="relative z-10 text-white">停止录音</span>
                        <span className="relative z-10 text-xs text-white">{formatRecordingTime(recordingTime)}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-6 w-6 relative z-10 text-white" />
                        <span className="relative z-10 text-white">开始录音</span>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Button
                  className="h-24 flex flex-col gap-2 bg-green-500 hover:bg-green-600 relative overflow-hidden"
                  onClick={() => setIsManualDialogOpen(true)}
                >
                  <div className="absolute inset-0 opacity-20">
                    <Image src="/images/manual-input.png" alt="Manual Input" fill className="object-contain" />
                  </div>
                  <Edit3 className="h-6 w-6 relative z-10" />
                  <span className="relative z-10">手动输入</span>
                </Button>

                <Dialog open={isManualDialogOpen} onOpenChange={setIsManualDialogOpen}>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Edit3 className="h-5 w-5" />
                        添加支出记录
                      </DialogTitle>
                      <DialogDescription>请填写支出详情</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          金额 *
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="col-span-3"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          标题 *
                        </Label>
                        <Input
                          id="title"
                          placeholder="支出描述"
                          className="col-span-3"
                          value={newExpense.title}
                          onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          分类 *
                        </Label>
                        <Select
                          value={newExpense.category}
                          onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => {
                              const IconComponent = iconMap[cat.icon] || ShoppingCart
                              return (
                                <SelectItem key={cat.id} value={cat.name}>
                                  <div className="flex items-center gap-2">
                                    <IconComponent className="h-4 w-4" />
                                    {cat.name}
                                  </div>
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="time" className="text-right">
                          时间
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          className="col-span-3"
                          value={newExpense.time}
                          onChange={(e) => setNewExpense({ ...newExpense, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleManualSubmit} className="bg-green-500 hover:bg-green-600">
                        <Save className="h-4 w-4 mr-2" />
                        保存记录
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* 今日记录 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    今日记录
                  </CardTitle>
                  <CardDescription>
                    今日共支出 {formatCurrency(stats.todayExpenses.reduce((sum, e) => sum + e.amount, 0))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    {stats.todayExpenses.length === 0 ? (
                      <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                        <div className="mb-4 opacity-50">
                          <Image
                            src="/images/empty-records.png"
                            alt="No Records"
                            width={120}
                            height={120}
                            className="object-contain"
                          />
                        </div>
                        <p className="font-medium">今日暂无支出记录</p>
                        <p className="text-sm">点击上方按钮开始记账</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stats.todayExpenses.map((expense) => {
                          const IconComponent = getCategoryIcon(expense.category)
                          return (
                            <div
                              key={expense.id}
                              className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${getCategoryColor(expense.category)} shadow-sm`}>
                                  <IconComponent className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <p className="font-medium">{expense.title}</p>
                                  <p className="text-sm text-gray-500">{expense.time}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-500">-{formatCurrency(expense.amount)}</p>
                                <Badge variant="secondary" className="text-xs">
                                  {expense.category}
                                </Badge>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 统计页面 */}
            <TabsContent value="stats" className="m-0 p-4 space-y-4">
              {/* 背景装饰 */}
              <div className="absolute top-0 left-0 w-full h-32 opacity-5 pointer-events-none">
                <Image src="/images/statistics-bg.png" alt="Statistics Background" fill className="object-cover" />
              </div>

              {/* 时间范围选择 */}
              <Card className="relative z-10">
                <CardContent className="p-4">
                  <div className="flex justify-center">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      {["month", "quarter", "year"].map((range) => (
                        <Button
                          key={range}
                          variant={statsTimeRange === range ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setStatsTimeRange(range)}
                          className="px-6"
                        >
                          {range === "month" ? "月" : range === "quarter" ? "季" : "年"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 支出总览 */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <TrendingUp className="h-5 w-5" />
                    支出总览
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">{formatCurrency(stats.monthlyTotal)}</p>
                    <p className="text-sm text-gray-500 mt-1">本月总支出</p>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-gray-500">记录数</p>
                        <p className="font-semibold text-blue-600">
                          {expenses.filter((e) => {
                            const expenseDate = new Date(e.date)
                            const now = new Date()
                            return (
                              expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
                            )
                          }).length} 笔
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <p className="text-gray-500">日均支出</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(stats.monthlyTotal / new Date().getDate())}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 趋势图 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    支出趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.monthlyTrends.every((data) => data.amount === 0) ? (
                    <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                      <div className="mb-4 opacity-50">
                        <BarChart3 className="h-16 w-16" />
                      </div>
                      <p>暂无趋势数据</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.monthlyTrends.map((data, index) => {
                        const maxAmount = Math.max(...stats.monthlyTrends.map((d) => d.amount))
                        const percentage = maxAmount > 0 ? (data.amount / maxAmount) * 100 : 0
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <span className="w-8 text-sm font-medium">{data.month}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-8 rounded-full flex items-center justify-end pr-3 transition-all duration-500 ease-out shadow-sm"
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              >
                                {data.amount > 0 && (
                                  <span className="text-white text-xs font-medium">{formatCurrency(data.amount)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 分类分布 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-500" />
                    分类分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.categoryStats.length === 0 ? (
                    <div className="text-center text-gray-500 py-8 flex flex-col items-center">
                      <div className="mb-4 opacity-50">
                        <PieChart className="h-16 w-16" />
                      </div>
                      <p>暂无分类数据</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.categoryStats.map((data, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${getCategoryColor(data.category)} shadow-sm`}></div>
                            <span className="text-sm font-medium">{data.category}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-sm font-medium">{formatCurrency(data.amount)}</span>
                              <span className="text-xs text-gray-500 ml-2">{data.percentage}%</span>
                            </div>
                            <div className="w-12 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getCategoryColor(data.category)}`}
                                style={{ width: `${data.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* 历史页面 */}
            <TabsContent value="history" className="m-0 p-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5 text-indigo-500" />
                    历史记录
                  </CardTitle>
                  <CardDescription>
                    总计 {expenses.length} 笔记录，累计支出{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* 这里应该添加历史记录的内容 */}
                  <p>历史记录内容待实现</p>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
