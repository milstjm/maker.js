namespace MakerJs.paths {
    
    /**
     * @private
     */
    interface IArcSpan {
        origin: IPoint;
        startAngle: number;
        endAngle: number;
        size: number;
    }

    /**
     * Class for arc path.
     */
    export class Arc implements IPathArc {
        public origin: IPoint;
        public radius: number;
        public startAngle: number;
        public endAngle: number;
        public type: string;

        /**
         * Class for arc path, created from origin point, radius, start angle, and end angle.
         * 
         * @param origin The center point of the arc.
         * @param radius The radius of the arc.
         * @param startAngle The start angle of the arc.
         * @param endAngle The end angle of the arc.
         */
        constructor(origin: IPoint, radius: number, startAngle: number, endAngle: number);

        /**
         * Class for arc path, created from 2 points, radius, large Arc flag, and clockwise flag.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param radius The radius of the arc.
         * @param largeArc Boolean flag to indicate clockwise direction.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, radius: number, largeArc: boolean, clockwise: boolean);

        /**
         * Class for arc path, created from 2 points and optional boolean flag indicating clockwise.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Second end point of the arc.
         * @param clockwise Boolean flag to indicate clockwise direction.
         */
        constructor(pointA: IPoint, pointB: IPoint, clockwise?: boolean);

        /**
         * Class for arc path, created from 3 points.
         * 
         * @param pointA First end point of the arc.
         * @param pointB Middle point on the arc.
         * @param pointC Second end point of the arc.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);

        constructor(...args: any[]) {

            switch (args.length) {

                case 5:
                    //SVG style arc designation

                    this.radius = args[2];

                    //find the 2 potential origins
                    var origins = path.intersection(
                        new Circle(args[0], this.radius),
                        new Circle(args[1], this.radius)
                    );

                    //there may be a condition where the radius is insufficient! Why does the SVG spec allow this?
                    if (origins) {

                        var largeArc = args[3] as boolean;
                        var clockwise = args[4] as boolean;
                        var span: IArcSpan;
                        var spans: IArcSpan[] = [];

                        for (var i = 2; i--;) {
                            var origin = origins.intersectionPoints[i];
                            var startAngle = angle.ofPointInDegrees(origin, args[clockwise ? 1 : 0]);
                            var endAngle = angle.ofPointInDegrees(origin, args[clockwise ? 0 : 1]);

                            if (endAngle < startAngle) {
                                endAngle += 360;
                            }

                            span = {
                                origin: origin,
                                startAngle: startAngle,
                                endAngle: endAngle,
                                size: endAngle - startAngle
                            };

                            //insert sorted by size ascending
                            if (spans.length == 0 || span.size > spans[0].size) {
                                spans.push(span);
                            } else {
                                spans.unshift(span);
                            }
                        }

                        var index = largeArc ? 1 : 0;
                        span = spans[index];

                        this.origin = span.origin;
                        this.startAngle = span.startAngle;
                        this.endAngle = span.endAngle;
                    }

                    break;

                case 4:
                    this.origin = args[0];
                    this.radius = args[1];
                    this.startAngle = args[2];
                    this.endAngle = args[3];
                    break;

                case 3:

                    if (isPoint(args[2])) {
                        //from 3 points

                        Circle.apply(this, args);

                        var angles: number[] = [];
                        for (var i = 0; i < 3; i++) {
                            angles.push(angle.ofPointInDegrees(this.origin, args[i]));
                        }

                        this.startAngle = angles[0];
                        this.endAngle = angles[2];

                        //swap start and end angles if this arc does not contain the midpoint
                        if (!measure.isBetweenArcAngles(angles[1], this, false)) {
                            this.startAngle = angles[2];
                            this.endAngle = angles[0];
                        }

                        //do not fall through if this was 3 points
                        break;
                    }

                //fall through to below if 2 points

                case 2:
                    //from 2 points (and optional clockwise flag)
                    var clockwise = args[2] as boolean;

                    Circle.call(this, args[0], args[1]);

                    this.startAngle = angle.ofPointInDegrees(this.origin, args[clockwise ? 1 : 0]);
                    this.endAngle = angle.ofPointInDegrees(this.origin, args[clockwise ? 0 : 1]);

                    break;
            }

            //do this after Circle.apply / Circle.call to make sure this is an arc
            this.type = pathType.Arc;
        }
    }

    /**
     * Class for circle path.
     */
    export class Circle implements IPathCircle {
        public type: string;
        public origin: IPoint;
        public radius: number;

        /**
         * Class for circle path, created from origin point and radius.
         * 
         * @param origin The center point of the circle.
         * @param radius The radius of the circle.
         */
        constructor(origin: IPoint, radius: number);

        /**
         * Class for circle path, created from 2 points.
         * 
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint);

        /**
         * Class for circle path, created from 3 points.
         * 
         * @param pointA First point on the circle.
         * @param pointB Second point on the circle.
         * @param pointC Third point on the circle.
         */
        constructor(pointA: IPoint, pointB: IPoint, pointC: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.Circle;

            if (args.length == 2) {

                if (typeof args[1] === 'number') {
                    this.origin = args[0];
                    this.radius = args[1];

                } else {
                    //Circle from 2 points
                    this.origin = point.average(args[0], args[1]);
                    this.radius = measure.pointDistance(this.origin, args[0]);
                }

            } else {
                //Circle from 3 points

                //create 2 lines with 2nd point in common
                var lines: IPathLine[] = [
                    new Line(args[0], args[1]),
                    new Line(args[1], args[2])
                ];

                //create perpendicular lines
                var perpendiculars: IPathLine[] = [];
                for (var i = 2; i--;) {
                    var midpoint = point.middle(lines[i]);
                    perpendiculars.push(<IPathLine>path.rotate(lines[i], 90, midpoint));
                }

                //find intersection of slopes of perpendiculars
                this.origin = point.fromSlopeIntersection(perpendiculars[0], perpendiculars[1]);

                //radius is distance to any of the 3 points
                this.radius = measure.pointDistance(this.origin, args[0]);
            }

        }
    }

    /**
     * Class for line path.
     * 
     * @param origin The origin point of the line.
     * @param end The end point of the line.
     */
    export class Line implements IPathLine {
        public type: string;

        constructor(public origin: IPoint, public end: IPoint) {
            this.type = pathType.Line;
        }
    }

    /**
     * Class for chord, which is simply a line path that connects the endpoints of an arc.
     * 
     * @param arc Arc to use as the basic for the chord.
     */
    export class Chord implements IPathLine {
        public type: string;
        public origin: IPoint;
        public end: IPoint;

        constructor(arc: IPathArc) {
            var arcPoints = point.fromArc(arc);

            this.type = pathType.Line;
            this.origin = arcPoints[0];
            this.end = arcPoints[1];
        }
    }

    /**
     * Class for a parallel line path.
     * 
     * @param toLine A line to be parallel to.
     * @param distance Distance between parallel and original line.
     * @param nearPoint Any point to determine which side of the line to place the parallel.
     */
    export class Parallel implements IPathLine {
        public type: string;
        public origin: IPoint;
        public end: IPoint;

        constructor(toLine: IPathLine, distance: number, nearPoint: IPoint) {
            this.type = pathType.Line;
            this.origin = point.clone(toLine.origin);
            this.end = point.clone(toLine.end);

            var angleOfLine = angle.ofLineInDegrees(this);

            function getNewOrigin(offsetAngle: number) {
                var origin = point.add(toLine.origin, point.fromPolar(angle.toRadians(angleOfLine + offsetAngle), distance));
                return {
                    origin: origin,
                    nearness: measure.pointDistance(origin, nearPoint)
                };
            }

            var newOrigins = [getNewOrigin(-90), getNewOrigin(90)];
            var newOrigin = (newOrigins[0].nearness < newOrigins[1].nearness) ? newOrigins[0].origin : newOrigins[1].origin;

            path.move(this, newOrigin);
        }
    }

    /**
     * Class for bezier seed.
     */
    export class BezierSeed implements IPathBezierSeed {
        public type: string;
        public origin: IPoint;
        public end: IPoint
        public controls: IPoint[];

        /**
         * Class for bezier seed, created from point array.
         * 
         * @param points Array of points, with the first being the origin, and the last being the end, and points between used as control points.
         */
        constructor(points: IPoint[]);

        /**
         * Class for quadratic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param control The control point of the curve.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, control: IPoint, end: IPoint);

        /**
         * Class for cubic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param controls The control points of the curve.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, controls: IPoint[], end: IPoint);

        /**
         * Class for cubic bezier seed.
         * 
         * @param origin The origin point of the curve.
         * @param control1 The control point of the curve origin.
         * @param control1 The control point of the curve end.
         * @param end The end point of the curve.
         */
        constructor(origin: IPoint, control1: IPoint, control2: IPoint, end: IPoint);

        constructor(...args: any[]) {
            this.type = pathType.BezierSeed;

            switch (args.length) {

                case 1: //point array
                    var points = args[0] as IPoint[];

                    this.origin = points[0];

                    if (points.length === 3) {
                        this.controls = [points[1]];
                        this.end = points[2];

                    } else if (points.length === 4) {
                        this.controls = [points[1], points[2]];
                        this.end = points[3];

                    } else {
                        this.end = points[1];
                    }

                    break;

                case 3: //quadratic or cubic
                    if (Array.isArray(args[1])) {
                        this.controls = args[1] as IPoint[];
                    } else {
                        this.controls = [args[1] as IPoint];
                    }

                    this.end = args[2] as IPoint;
                    break;

                case 4: //cubic params
                    this.controls = [args[1] as IPoint, args[2] as IPoint];
                    this.end = args[3] as IPoint;
                    break;
            }

        }
    }

}
