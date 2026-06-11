import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Layout, 
  X, 
  ChevronRight,
  ListTodo,
  AlertCircle,
  Loader2,
  MoreVertical
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useFirebase } from '../contexts/FirebaseContext';

interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'Pending' | 'Completed';
  createdAt: any;
}

interface TaskManagerProps {
  onBack: () => void;
}

export default function TaskManager({ onBack }: TaskManagerProps) {
  const { user } = useFirebase();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '' });
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Completed'>('All');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      // Sort client-side to avoid needing a composite index
      const sortedDocs = docs.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setTasks(sortedDocs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newTask.title.trim()) return;

    try {
      const taskData = {
        userId: user.uid,
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        status: 'Pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tasks'), taskData);
      setNewTask({ title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'Pending' ? 'Completed' : 'Pending';
      await updateDoc(doc(db, 'tasks', task.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All') return true;
    return task.status === filter;
  });

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-6 py-8 border-b border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 leading-none">Task List</h1>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Manage your daily goals</p>
          </div>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200 hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
        {(['All', 'Pending', 'Completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f 
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' 
                : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto px-6 pb-20 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-xs font-bold font-mono">Syncing tasks...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <AnimatePresence initial={false}>
            {filteredTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 rounded-[2.5rem] border ${
                  task.status === 'Completed' ? 'border-gray-50 opacity-60' : 'border-gray-100 shadow-sm'
                } flex items-start gap-4 group transition-all`}
              >
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={`mt-1 flex-shrink-0 transition-colors ${
                    task.status === 'Completed' ? 'text-emerald-500' : 'text-gray-300 hover:text-emerald-500'
                  }`}
                >
                  {task.status === 'Completed' ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-black text-gray-900 leading-tight mb-1 ${
                    task.status === 'Completed' ? 'line-through text-gray-400' : ''
                  }`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className={`text-[11px] font-medium text-gray-500 leading-relaxed truncate ${
                      task.status === 'Completed' ? 'line-through' : ''
                    }`}>
                      {task.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <Calendar className="w-3 h-3 text-gray-300" />
                    <span className="text-[9px] font-bold text-gray-400">
                      {task.createdAt?.toDate ? task.createdAt.toDate().toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteTask(task.id)}
                  className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-rose-50 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ListTodo className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-sm font-black text-gray-900">No tasks found</h3>
            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest px-10">
              {filter === 'All' ? 'Start by adding a new goal to your day' : `No ${filter.toLowerCase()} tasks found`}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[3rem] p-8 pb-12 z-[70] shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">New Goal</h2>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">Break it down, make it happen</p>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Task Title</label>
                  <input 
                    autoFocus
                    required
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="E.g. Daily Inventory Check"
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Notes (Optional)</label>
                  <textarea 
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Add details..."
                    rows={3}
                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 placeholder:text-gray-300 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!newTask.title.trim()}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-gray-200 mt-4 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  Create Task
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
