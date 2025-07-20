
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, DocumentData } from 'firebase/firestore';
import type { CompletedShift } from './types';

function docToShift(doc: DocumentData): CompletedShift {
    const data = doc.data();
    return {
        id: doc.id,
        client: data.client,
        startTime: data.startTime,
        endTime: data.endTime,
        completedTasks: data.completedTasks,
        incompleteTasks: data.incompleteTasks,
        notes: data.notes,
    };
}


export async function getShifts(): Promise<CompletedShift[]> {
  try {
    const shiftsCollection = collection(db, 'shifts');
    const shiftsSnapshot = await getDocs(shiftsCollection);
    const shiftsList = shiftsSnapshot.docs.map(doc => docToShift(doc));
    return shiftsList;
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return [];
  }
}

export async function addShift(shift: Omit<CompletedShift, 'id'>) {
    try {
        const shiftsCollection = collection(db, 'shifts');
        await addDoc(shiftsCollection, shift);
    } catch (error) {
        console.error("Error adding shift:", error);
        throw new Error("Could not add shift.");
    }
}

export async function updateShiftNotes(shiftId: string, notes: string) {
    try {
        const shiftDocRef = doc(db, 'shifts', shiftId);
        await updateDoc(shiftDocRef, { notes });
    } catch (error) {
        console.error("Error updating notes:", error);
        throw new Error("Could not update notes.");
    }
}
