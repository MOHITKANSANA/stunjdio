
'use client';

import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from '@/components/ui/skeleton';
import { IndianRupee, BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


const CouponDialog = ({ 
    isOpen, 
    onOpenChange, 
    course, 
    courseId,
    onEnrollSuccess 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
    course: any, 
    courseId: string,
    onEnrollSuccess: () => void 
}) => {
    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isValidCoupon, setIsValidCoupon] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const finalPrice = course.price - discount;

    const checkCoupon = async () => {
        if (!couponCode) return;
        setIsLoading(true);
        try {
            const couponRef = doc(firestore, 'courses', courseId, 'coupons', couponCode);
            const couponSnap = await getDoc(couponRef);
            if (couponSnap.exists()) {
                const couponData = couponSnap.data();
                const now = new Date();
                if (couponData.expiresAt.toDate() > now) {
                    setDiscount(couponData.discountAmount);
                    setIsValidCoupon(true);
                    toast({ description: `Coupon applied! You get ₹${couponData.discountAmount} off.` });
                } else {
                    setDiscount(0);
                    setIsValidCoupon(false);
                    toast({ variant: 'destructive', description: 'This coupon has expired.' });
                }
            } else {
                setDiscount(0);
                setIsValidCoupon(false);
                toast({ variant: 'destructive', description: 'Invalid coupon code.' });
            }
        } catch (error) {
            toast({ variant: 'destructive', description: 'Could not validate coupon.' });
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enroll in {course.title}</DialogTitle>
                    <DialogDescription>Apply a coupon or proceed to payment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Original Price:</span>
                        <span className="font-semibold text-lg line-through">₹{course.price}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between items-baseline text-green-600">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="font-semibold text-lg">- ₹{discount}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline text-xl font-bold">
                        <span>Final Price:</span>
                        <span>₹{finalPrice}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Input 
                            placeholder="Enter Coupon Code" 
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        />
                        <Button onClick={checkCoupon} disabled={isLoading || !couponCode}>
                            {isLoading ? 'Checking...' : 'Apply'}
                        </Button>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button asChild onClick={onEnrollSuccess}>
                       <Link href={`/dashboard/payment-verification?courseId=${courseId}&price=${finalPrice}&coupon=${couponCode}`}>
                            Proceed to Pay ₹{finalPrice}
                       </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const CourseCard = ({ course, courseId, isEnrolled, onEnrollClick }: { course: any, courseId: string, isEnrolled: boolean, onEnrollClick: () => void }) => {
    return (
        <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative h-48 w-full">
                <Image src={course.imageUrl || `https://picsum.photos/seed/${courseId}/600/400`} alt={course.title} fill style={{objectFit: "cover"}} data-ai-hint="online course" />
            </div>
            <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
                <CardDescription>{course.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-muted-foreground line-clamp-3">{course.description}</p>
                <div className="flex items-center font-bold text-lg mt-4">
                    {course.isFree ? 'Free' : (
                        <>
                            <IndianRupee className="h-5 w-5 mr-1" />
                            {course.price ? course.price.toLocaleString() : 'N/A'}
                        </>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                {isEnrolled ? (
                     <Button asChild className="w-full" variant="secondary">
                        <Link href={`/dashboard/courses/${courseId}`}>
                            View Details
                        </Link>
                     </Button>
                ) : (
                    <Button onClick={onEnrollClick} className="w-full">
                        Enroll Now
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
};

const CourseGrid = ({ courses, enrollments }: { courses: QueryDocumentSnapshot<DocumentData>[] | undefined, enrollments: any }) => {
    const [selectedCourse, setSelectedCourse] = useState<{ course: any, courseId: string } | null>(null);

    if (!courses) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
            </div>
        );
    }
    
    if (courses.length === 0) {
        return (
            <div className="text-center py-12">
                <BookOpenCheck className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Courses Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">There are no courses in this section yet.</p>
            </div>
        )
    }

    const enrolledCourseIds = new Set(enrollments?.docs.map(doc => doc.data().courseId));

    return (
        <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((doc) => {
                    const course = doc.data();
                    const isEnrolled = enrolledCourseIds.has(doc.id);
                    return (
                        <CourseCard 
                            key={doc.id} 
                            course={course} 
                            courseId={doc.id} 
                            isEnrolled={isEnrolled} 
                            onEnrollClick={() => setSelectedCourse({ course, courseId: doc.id })}
                        />
                    )
                })}
            </div>
            {selectedCourse && (
                <CouponDialog 
                    isOpen={!!selectedCourse} 
                    onOpenChange={() => setSelectedCourse(null)}
                    course={selectedCourse.course}
                    courseId={selectedCourse.courseId}
                    onEnrollSuccess={() => setSelectedCourse(null)}
                />
            )}
        </>
    );
};


export default function CoursesPage() {
  const { user } = useAuth();
  
  const [coursesCollection, loading, error] = useCollection(
    query(collection(firestore, 'courses'), orderBy('title', 'asc'))
  );

  const enrollmentsQuery = user 
    ? query(
        collection(firestore, 'enrollments'), 
        where('userId', '==', user.uid),
        where('status', '==', 'approved')
      )
    : null;
  const [enrollments] = useCollection(enrollmentsQuery);
  
  const enrolledCourseIds = new Set(enrollments?.docs.map(doc => doc.data().courseId) || []);

  const allPaidCourses = coursesCollection?.docs.filter(doc => !doc.data().isFree);
  const myCourses = coursesCollection?.docs.filter(doc => enrolledCourseIds.has(doc.id));


  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-headline">Courses</h1>
        <p className="text-muted-foreground mt-2">Explore our comprehensive catalog of courses to enhance your skills.</p>
      </div>

      <Tabs defaultValue="all-courses">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="all-courses">All Courses</TabsTrigger>
            <TabsTrigger value="my-courses">My Courses</TabsTrigger>
        </TabsList>
        <TabsContent value="all-courses" className="mt-6">
            {error && <p className="text-destructive">Error loading courses: {error.message}</p>}
            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            ) : (
                <CourseGrid courses={allPaidCourses} enrollments={enrollments} />
            )}
        </TabsContent>
         <TabsContent value="my-courses" className="mt-6">
            {loading ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
                </div>
            ) : (
                <CourseGrid courses={myCourses} enrollments={enrollments} />
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
