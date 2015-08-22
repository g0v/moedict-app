/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
 */

<<<<<<< HEAD
#import "CDVJSON.h"
#import <Foundation/NSJSONSerialization.h>
=======
#import "CDVJSON_private.h"
>>>>>>> master

@implementation NSArray (CDVJSONSerializing)

- (NSString*)JSONString
{
<<<<<<< HEAD
    NSError* error = nil;
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject:self
                                                       options:NSJSONWritingPrettyPrinted
                                                         error:&error];

    if (error != nil) {
        NSLog(@"NSArray JSONString error: %@", [error localizedDescription]);
        return nil;
    } else {
        return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
=======
    return [self cdv_JSONString];
>>>>>>> master
}

@end

@implementation NSDictionary (CDVJSONSerializing)

- (NSString*)JSONString
{
<<<<<<< HEAD
    NSError* error = nil;
    NSData* jsonData = [NSJSONSerialization dataWithJSONObject:self
                                                       options:NSJSONWritingPrettyPrinted
                                                         error:&error];

    if (error != nil) {
        NSLog(@"NSDictionary JSONString error: %@", [error localizedDescription]);
        return nil;
    } else {
        return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
=======
    return [self cdv_JSONString];
>>>>>>> master
}

@end

@implementation NSString (CDVJSONSerializing)

- (id)JSONObject
{
<<<<<<< HEAD
    NSError* error = nil;
    id object = [NSJSONSerialization JSONObjectWithData:[self dataUsingEncoding:NSUTF8StringEncoding]
                                                options:NSJSONReadingMutableContainers
                                                  error:&error];

    if (error != nil) {
        NSLog(@"NSString JSONObject error: %@", [error localizedDescription]);
    }

    return object;
=======
    return [self cdv_JSONObject];
>>>>>>> master
}

- (id)JSONFragment
{
<<<<<<< HEAD
    NSError* error = nil;
    id object = [NSJSONSerialization JSONObjectWithData:[self dataUsingEncoding:NSUTF8StringEncoding]
                                                options:NSJSONReadingAllowFragments
                                                  error:&error];

    if (error != nil) {
        NSLog(@"NSString JSONObject error: %@", [error localizedDescription]);
    }

    return object;
=======
    return [self cdv_JSONFragment];
>>>>>>> master
}

@end
